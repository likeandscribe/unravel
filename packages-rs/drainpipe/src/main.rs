use futures::StreamExt as _;
use rsky_lexicon::com::atproto::sync::{SubscribeRepos, SubscribeReposCommit};
use serde::{ser::SerializeStruct, Serialize};
use std::{path::PathBuf, thread, time::Duration};
use tokio_tungstenite::tungstenite::protocol::Message;

mod firehose;

async fn process(message: Vec<u8>, ctx: Context) {
    if let Ok((_header, SubscribeRepos::Commit(commit))) = firehose::read(&message) {
        let frontpage_ops = commit
            .operations
            .iter()
            .filter(|op| op.path.starts_with("com.tom-sherman.frontpage."))
            .map(|op| {
                SubscribeReposCommitOperation(
                    rsky_lexicon::com::atproto::sync::SubscribeReposCommitOperation {
                        path: op.path.clone(),
                        action: op.action.clone(),
                        cid: op.cid.clone(),
                    },
                )
            })
            .collect::<Vec<_>>();

        // TODO: Save offset, handle failures, etc.
        if frontpage_ops.len() > 0 {
            process_frontpage_ops(frontpage_ops, &commit, &ctx)
                .await
                .expect("Failed to process ops (todo: handle this)");
        }
    }
}

struct SubscribeReposCommitOperation(
    rsky_lexicon::com::atproto::sync::SubscribeReposCommitOperation,
);

impl Serialize for SubscribeReposCommitOperation {
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

async fn process_frontpage_ops(
    ops: Vec<SubscribeReposCommitOperation>,
    _commit: &SubscribeReposCommit,
    ctx: &Context,
) -> anyhow::Result<()> {
    // TODO: Send commit
    let client = reqwest::Client::new();
    let response = client
        .post(&ctx.frontpage_consumer_url) // TODO: Add webhook URL
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

#[derive(Clone, Debug)]
struct Context {
    frontpage_consumer_secret: String,
    frontpage_consumer_url: String,
}

#[tokio::main]
async fn main() {
    if let Some(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR").ok() {
        let env_path: PathBuf = [manifest_dir, ".env.local".to_owned()].iter().collect();
        dotenv_flow::from_filename(env_path).ok();
    }
    let ctx = Context {
        frontpage_consumer_secret: std::env::var("FRONTPAGE_CONSUMER_SECRET")
            .expect("FRONTPAGE_CONSUMER_SECRET not set"),
        frontpage_consumer_url: std::env::var("FRONTPAGE_CONSUMER_URL")
            .expect("FRONTPAGE_CONSUMER_URL not set"),
    };

    loop {
        match tokio_tungstenite::connect_async(
            "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos",
        )
        .await
        {
            Ok((mut socket, _response)) => {
                println!("Connected to bgs.bsky-sandbox.dev.");
                while let Some(Ok(Message::Binary(message))) = socket.next().await {
                    let ctx = ctx.clone();
                    tokio::spawn(async move {
                        process(message, ctx).await;
                    });
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
