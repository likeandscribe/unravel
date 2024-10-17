FROM rust:1.78-alpine AS builder

RUN apk add libressl-dev musl-dev sqlite-dev

WORKDIR /usr/src/unravel
COPY . .
# TODO: Use cargo-chef to cache dependencies compilation independently of the binary
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/root/target \
    cargo build --release --package drainpipe && \
    # Move the release binary to a folder to be copied to the final image. It can't be copied directly from the target folder because it's in a cache mount
    # See https://gist.github.com/noelbundick/6922d26667616e2ba5c3aff59f0824cd?permalink_comment_id=4379948#gistcomment-4379948
    mv ./target/release /root

FROM alpine:3.14
COPY --from=builder /root/release/drainpipe /

ENV DATABASE_URL="/drainpipedata/drainpipe.db"

ENTRYPOINT ["/drainpipe"]
