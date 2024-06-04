use futures::StreamExt as _;
use rsky_lexicon::com::atproto::sync::SubscribeRepos;
use std::{thread, time::Duration};
use tokio_tungstenite::tungstenite::protocol::Message;

// #[derive(Debug, Deserialize)]
// #[serde(tag = "$type")]
// enum Lexicon {
//     #[serde(rename(deserialize = "app.bsky.feed.post"))]
//     AppBskyFeedPost(Post),
//     #[serde(rename(deserialize = "app.bsky.feed.like"))]
//     AppBskyFeedLike(Like),
//     #[serde(rename(deserialize = "app.bsky.graph.follow"))]
//     AppBskyFeedFollow(Follow),
// }

async fn process(message: Vec<u8>) {
    let (_header, body) = rsky_firehose::firehose::read(&message).unwrap();
    println!(
        "Received message: {:?}",
        match body {
            SubscribeRepos::Commit(commit) => format!("{:?}", commit.operations),
            SubscribeRepos::Handle(handle) => format!("{:?}", handle),
            SubscribeRepos::Tombstone(tombstone) => format!("{:?}", tombstone),
        }
    );
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    loop {
        match tokio_tungstenite::connect_async(
            "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos",
        )
        .await
        {
            Ok((mut socket, _response)) => {
                println!("Connected to bsky.network.");
                while let Some(Ok(Message::Binary(message))) = socket.next().await {
                    tokio::spawn(async move {
                        process(message).await;
                    });
                }
            }
            Err(error) => {
                eprintln!("Error connecting to bsky.network. Waiting to reconnect: {error:?}");
                thread::sleep(Duration::from_millis(500));
                continue;
            }
        }
    }
}
