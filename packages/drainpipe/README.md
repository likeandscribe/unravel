# drainpipe

Drainpipe is Scribe's Firehose consumer.

Note: Right now it's kind of a stub service, it does nothing except log messages to stdout. The goal is for it to build up databases and indexes for our various AppViews (planned so far is the scribe main app and the frontpage link aggregation app).

## Building dockerfile locally

From the root of the monorepo:

```
docker build -f ./packages/pds/Dockerfile .
```

## Deploying to fly.io

From the root of the monorepo:

```
fly deploy . -c ./packages/pds/fly.toml --dockerfile ./packages/pds/Dockerfile
```
