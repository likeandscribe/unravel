# drainpipe

Drainpipe is Scribe's Firehose consumer.

Note: Right now it's kind of a stub service, it does nothing except log messages to stdout. The goal is for it route messages to the various AppViews (planned so far is the scribe main app and the frontpage link aggregation app). Each AppView would have a HTTP endpoint that can take a message from drainpipe, hydrate it, and save it so that it can be displayed in the app.

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
