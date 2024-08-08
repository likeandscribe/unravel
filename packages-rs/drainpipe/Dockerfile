FROM rust:1.78-alpine AS builder

RUN apk add libressl-dev musl-dev sqlite-dev

WORKDIR /usr/src/unravel
COPY . .
# TODO: Figure out how to cache compilation artifacts and maybe split fetching into a different layer
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release --package drainpipe

FROM alpine:3.14
COPY --from=builder /usr/src/unravel/target/release/drainpipe /

ENV DATABASE_URL="/drainpipedata/drainpipe.db"
ENV FRONTPAGE_CONSUMER_URL="https://frontpage.fyi/api/receive_hook"

ENTRYPOINT ["/drainpipe"]
