use db::update_seq;
use diesel::sqlite::SqliteConnection;
use futures::StreamExt as _;
use rsky_lexicon::com::atproto::sync::{SubscribeRepos, SubscribeReposCommit};
use serde::{ser::SerializeStruct, Serialize};
use std::{path::PathBuf, thread, time::Duration};
use tokio_tungstenite::tungstenite::protocol::Message;

mod db;
mod firehose;
mod schema;

async fn process(message: Vec<u8>, ctx: &mut Context) {
    if let Ok((_header, SubscribeRepos::Commit(commit))) = firehose::read(&message) {
        let frontpage_ops = commit
            .operations
            .iter()
            .filter(|op| op.path.starts_with("com.tom-sherman.frontpage."))
            .map(|op| SubscribeReposCommitOperation(&op))
            .collect::<Vec<_>>();

        if frontpage_ops.len() > 0 {
            match process_frontpage_ops(frontpage_ops, &commit, &ctx).await {
                Ok(_) => {
                    update_seq(&mut ctx.db_connection, commit.sequence)
                        .map_err(|_| eprintln!("Failed to update sequence"))
                        .ok();
                }
                Err(e) => {
                    // TODO: Record to dead letter queue
                    eprintln!("Failed to process frontpage ops: {:?}", e);
                }
            }
        }
    }
}

struct SubscribeReposCommitOperation<'a>(
    &'a rsky_lexicon::com::atproto::sync::SubscribeReposCommitOperation,
);

impl<'a> Serialize for SubscribeReposCommitOperation<'a> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut state = serializer.serialize_struct("SubscribeReposCommitOperation", 2)?;
        state.serialize_field("path", &self.0.path)?;
        state.serialize_field("action", &self.0.action)?;
        state.serialize_field("cid", &self.0.cid)?;
        state.end()
    }
}

async fn process_frontpage_ops<'a>(
    ops: Vec<SubscribeReposCommitOperation<'a>>,
    _commit: &'a SubscribeReposCommit,
    ctx: &Context,
) -> anyhow::Result<()> {
    let client = reqwest::Client::new();
    let response = client
        .post(&ctx.frontpage_consumer_url)
        .header(
            "Authorization",
            format!("Bearer {}", ctx.frontpage_consumer_secret),
        )
        .json(&ops)
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

    loop {
        match tokio_tungstenite::connect_async(
            "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos",
        )
        .await
        {
            Ok((mut socket, _response)) => {
                let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
                let mut ctx = Context {
                    frontpage_consumer_secret: std::env::var("FRONTPAGE_CONSUMER_SECRET")
                        .expect("FRONTPAGE_CONSUMER_SECRET not set"),
                    frontpage_consumer_url: std::env::var("FRONTPAGE_CONSUMER_URL")
                        .expect("FRONTPAGE_CONSUMER_URL not set"),
                    db_connection: db::db_connect(&database_url).expect("Failed to connect to db"),
                };
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
                    metrics_monitor.instrument(process(message, &mut ctx)).await;
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
