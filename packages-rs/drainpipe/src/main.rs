use db::{record_dead_letter, update_seq};
use diesel::sqlite::SqliteConnection;
use futures::{StreamExt as _, TryFutureExt};
use std::{path::PathBuf, thread, time::Duration};
use tokio_tungstenite::tungstenite::protocol::Message;

mod db;
mod firehose;
mod schema;

#[derive(Debug)]
enum ProcessError {
    DecodeError(firehose::Error),
    ProcessError { seq: i64, error: anyhow::Error },
}

/// Process a message from the firehose. Returns the sequence number of the message or an error.
async fn process(message: Vec<u8>, ctx: &mut Context) -> Result<i64, ProcessError> {
    let (_header, message) = firehose::read(&message).map_err(|e| ProcessError::DecodeError(e))?;
    let sequence = match message {
        firehose::SubscribeRepos::Commit(commit) => {
            let frontpage_ops = commit
                .operations
                .iter()
                .filter(|op| op.path.starts_with("com.tom-sherman.frontpage."))
                .collect::<Vec<_>>();
            if !frontpage_ops.is_empty() {
                process_frontpage_ops(&frontpage_ops, &commit, &ctx)
                    .map_err(|e| ProcessError::ProcessError {
                        seq: commit.sequence,
                        error: e,
                    })
                    .await?;
            }
            commit.sequence
        }
        firehose::SubscribeRepos::Handle(handle) => handle.sequence,
        firehose::SubscribeRepos::Tombstone(tombstone) => tombstone.sequence,
    };

    Ok(sequence)
}

async fn process_frontpage_ops(
    ops: &Vec<&firehose::SubscribeReposCommitOperation>,
    _commit: &firehose::SubscribeReposCommit,
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
                    match metrics_monitor.instrument(process(message, &mut ctx)).await {
                        Ok(seq) => {
                            update_seq(&mut ctx.db_connection, seq)
                                .map_err(|_| eprintln!("Failed to update sequence"))
                                .ok();
                        }
                        Err(error) => {
                            eprintln!("Error processing message: {error:?}");
                            if let ProcessError::ProcessError { seq, error } = error {
                                record_dead_letter(
                                    &mut ctx.db_connection,
                                    // TODO: Would be good to include the actual dropped message here but my rust skill issues are preventing me from doing so
                                    &error.to_string(),
                                    seq,
                                )
                                .map_err(|_| eprintln!("Failed to record dead letter"))
                                .ok();
                            }
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
