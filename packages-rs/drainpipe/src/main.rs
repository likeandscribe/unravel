use db::{record_dead_letter, update_seq};
use debug_ignore::DebugIgnore;
use diesel::{
    backend::Backend,
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    serialize::ToSql,
    sql_types::Integer,
    sqlite::SqliteConnection,
};
use futures::{StreamExt as _, TryFutureExt};
use serde::Serialize;
use std::{path::PathBuf, thread, time::Duration};
use tokio_tungstenite::tungstenite::protocol::Message;

mod db;
mod firehose;
mod schema;

#[repr(i32)]
#[derive(Debug, AsExpression, PartialEq, FromSqlRow)]
#[diesel(sql_type = Integer)]
pub enum ProcessErrorKind {
    DecodeError,
    ProcessError,
}

impl<DB> ToSql<Integer, DB> for ProcessErrorKind
where
    i32: ToSql<Integer, DB>,
    DB: Backend,
{
    fn to_sql<'b>(
        &'b self,
        out: &mut diesel::serialize::Output<'b, '_, DB>,
    ) -> diesel::serialize::Result {
        match self {
            ProcessErrorKind::DecodeError => 0.to_sql(out),
            ProcessErrorKind::ProcessError => 1.to_sql(out),
        }
    }
}

impl<DB> FromSql<Integer, DB> for ProcessErrorKind
where
    DB: Backend,
    i32: FromSql<Integer, DB>,
{
    fn from_sql(bytes: <DB as Backend>::RawValue<'_>) -> diesel::deserialize::Result<Self> {
        match i32::from_sql(bytes)? {
            0 => Ok(ProcessErrorKind::DecodeError),
            1 => Ok(ProcessErrorKind::ProcessError),
            x => Err(format!("Unrecognized variant {}", x).into()),
        }
    }
}

#[derive(Debug)]
struct ProcessError {
    seq: i64,
    inner: anyhow::Error,
    source: DebugIgnore<Vec<u8>>,
    kind: ProcessErrorKind,
}

/// Process a message from the firehose. Returns the sequence number of the message or an error.
async fn process(message: Vec<u8>, ctx: &mut Context) -> Result<i64, ProcessError> {
    let (_header, data) = firehose::read(&message).map_err(|e| ProcessError {
        inner: e.into(),
        seq: -1,
        source: message.clone().into(),
        kind: ProcessErrorKind::DecodeError,
    })?;
    let sequence = match data {
        firehose::SubscribeRepos::Commit(commit) => {
            let frontpage_ops = commit
                .operations
                .iter()
                .filter(|op| op.path.starts_with("fyi.unravel.frontpage."))
                .collect::<Vec<_>>();
            if !frontpage_ops.is_empty() {
                process_frontpage_ops(&frontpage_ops, &commit, &ctx)
                    .map_err(|e| ProcessError {
                        seq: commit.sequence,
                        inner: e,
                        source: message.clone().into(),
                        kind: ProcessErrorKind::ProcessError,
                    })
                    .await?;
            }
            commit.sequence
        }
        msg => msg.sequence(),
    };

    Ok(sequence)
}

fn i64_serialize<S>(x: &i64, s: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    s.serialize_str(&x.to_string())
}

#[derive(Serialize, Debug)]
struct ConsumerBody<'a> {
    ops: &'a Vec<&'a firehose::SubscribeReposCommitOperation>,
    repo: &'a str,
    #[serde(serialize_with = "i64_serialize")]
    seq: i64,
}

async fn process_frontpage_ops(
    ops: &Vec<&firehose::SubscribeReposCommitOperation>,
    commit: &firehose::SubscribeReposCommit,
    ctx: &Context,
) -> anyhow::Result<()> {
    let client = reqwest::Client::new();
    let response = client
        .post(&ctx.frontpage_consumer_url)
        .header(
            "Authorization",
            format!("Bearer {}", ctx.frontpage_consumer_secret),
        )
        .json(&ConsumerBody {
            ops,
            repo: &commit.repo,
            seq: commit.sequence,
        })
        .send()
        .await?;

    let status = response.status();
    if status.is_success() {
        println!("Successfully sent frontpage ops");
    } else {
        anyhow::bail!("Failed to send frontpage ops: {:?}", status)
    }
    Ok(())
}

struct Context {
    frontpage_consumer_secret: String,
    frontpage_consumer_url: String,
    db_connection: SqliteConnection,
}

#[tokio::main]
async fn main() {
    // Load environment variables from .env.local and .env when ran with cargo run
    if let Some(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR").ok() {
        let env_path: PathBuf = [&manifest_dir, ".env.local"].iter().collect();
        dotenv_flow::from_filename(env_path).ok();
        let env_path: PathBuf = [&manifest_dir, ".env"].iter().collect();
        dotenv_flow::from_filename(env_path).ok();
    }

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let conn = db::db_connect(&database_url).expect("Failed to connect to db");
    let mut ctx = Context {
        frontpage_consumer_secret: std::env::var("FRONTPAGE_CONSUMER_SECRET")
            .expect("FRONTPAGE_CONSUMER_SECRET not set"),
        frontpage_consumer_url: std::env::var("FRONTPAGE_CONSUMER_URL")
            .expect("FRONTPAGE_CONSUMER_URL not set"),
        db_connection: conn,
    };

    db::run_migrations(&mut ctx.db_connection).expect("Failed to run migrations");

    let cursor = db::get_seq(&mut ctx.db_connection).expect("Failed to get sequence");

    loop {
        match tokio_tungstenite::connect_async(format!(
            "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos?cursor={}",
            cursor
        ))
        .await
        {
            Ok((mut socket, _response)) => {
                let metrics_monitor = tokio_metrics::TaskMonitor::new();
                {
                    let metrics_monitor = metrics_monitor.clone();
                    tokio::spawn(async move {
                        for interval in metrics_monitor.intervals() {
                            println!("{:?} per second", interval.instrumented_count as f64 / 5.0);
                            tokio::time::sleep(Duration::from_millis(5000)).await;
                        }
                    });
                }

                println!("Connected to bgs.bsky-sandbox.dev.");
                while let Some(Ok(Message::Binary(message))) = socket.next().await {
                    match metrics_monitor.instrument(process(message, &mut ctx)).await {
                        Ok(seq) => {
                            update_seq(&mut ctx.db_connection, seq)
                                .map_err(|_| eprintln!("Failed to update sequence"))
                                .ok();
                        }
                        Err(error) => {
                            eprintln!("Error processing message: {error:?}");
                            record_dead_letter(&mut ctx.db_connection, &error)
                                .map_err(|e| eprintln!("Failed to record dead letter {e:?}"))
                                .ok();
                        }
                    }
                }
            }
            Err(error) => {
                eprintln!(
                    "Error connecting to bgs.bsky-sandbox.dev. Waiting to reconnect: {error:?}"
                );
                thread::sleep(Duration::from_millis(500));
                continue;
            }
        }
    }
}
