# Drainpipe

Drainpipe is a atproto [firehose](https://docs.bsky.app/docs/advanced-guides/firehose) consumer written in rust. It knows how to reliably* take messages from the firehose, filter them, and forward them over HTTPs to a webhook receiver some place else on the internet.

<sup>*totally subjective opinion.</sup>

## Setup

1. Install diesel cli

   ```
   cargo install diesel_cli --no-default-features --features sqlite
   ```

2. Create the database.

   ```
   diesel setup
   ```

3. Run sql migrations

   ```
   diesel migration run
   ```

## Building dockerfile locally

From the root of the monorepo

```
docker build -f ./packages-rs/drainpipe/Dockerfile .
```

## Deploying to fly.io

```
fly deploy . -c ./packages-rs/drainpipe/fly.toml --dockerfile ./packages-rs/drainpipe/Dockerfile
```
