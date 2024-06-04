FROM rust:1.78-alpine as builder

RUN apk add libressl-dev musl-dev

WORKDIR /usr/src/drainpipe
COPY . .
# TODO: Figure out how to cache compilation artifacts and maybe split fetching into a different layer
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release --package drainpipe

FROM alpine:3.14
COPY --from=builder /usr/src/drainpipe/target/release/drainpipe /
ENTRYPOINT ["/drainpipe"]
