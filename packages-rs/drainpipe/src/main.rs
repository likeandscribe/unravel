use db::{record_dead_letter, update_seq};
use diesel::sqlite::SqliteConnection;
use futures::{StreamExt as _, TryFutureExt};
use serde::Serialize;
use std::{path::PathBuf, thread, time::Duration};
use tokio_tungstenite::tungstenite::protocol::Message;

mod db;
mod firehose;
mod schema;

#[derive(Debug)]
enum ProcessErrorKind {
    DecodeError,
    ProcessError,
}

#[derive(Debug)]
struct ProcessError {
    seq: i64,
    inner: anyhow::Error,
    msg: Vec<u8>,
    kind: ProcessErrorKind,
}

/// Process a message from the firehose. Returns the sequence number of the message or an error.
async fn process(message: Vec<u8>, ctx: &mut Context) -> Result<i64, ProcessError> {
    let (_header, data) = firehose::read(&message).map_err(|e| ProcessError {
        inner: e.into(),
        seq: -1,
        msg: message.clone(),
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
                        msg: message.clone(),
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
    let mut conn = db::db_connect(&database_url).expect("Failed to connect to db");
    let cursor = db::get_seq(&mut conn).expect("Failed to get sequence");

    loop {
        match tokio_tungstenite::connect_async(format!(
            "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos?cursor={}",
            cursor
        ))
        .await
        {
            Ok((mut socket, _response)) => {
                let mut ctx = Context {
                    frontpage_consumer_secret: std::env::var("FRONTPAGE_CONSUMER_SECRET")
                        .expect("FRONTPAGE_CONSUMER_SECRET not set"),
                    frontpage_consumer_url: std::env::var("FRONTPAGE_CONSUMER_URL")
                        .expect("FRONTPAGE_CONSUMER_URL not set"),
                    db_connection: db::db_connect(&database_url).expect("Failed to connect to db"),
                };
                db::run_migrations(&mut ctx.db_connection).expect("Failed to run migrations");
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
                            record_dead_letter(
                                &mut ctx.db_connection,
                                error.kind,
                                &error.inner.to_string(),
                                error.seq,
                                &String::from_utf8(error.msg)
                                    .unwrap_or("Unable to decode message".to_string()),
                            )
                            .map_err(|_| eprintln!("Failed to record dead letter"))
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
