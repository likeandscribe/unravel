FROM node:20.11-alpine3.18 AS base
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
# Move files into the image and install
COPY . .
RUN pnpm i turbo -g
RUN turbo prune @repo/pds --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY .gitignore .gitignore
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --production --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install sharp@0.32.6 -w --production
RUN  pnpm rebuild sharp

COPY --from=builder /app/out/full/ .

FROM base AS runner
WORKDIR /app

WORKDIR /app
COPY --from=installer /app .
COPY --from=installer /app/node_modules ./node_modules

EXPOSE 8080
ENV PDS_PORT=8080
ENV NODE_ENV=production
# potential perf issues w/ io_uring on this version of node
ENV UV_USE_IO_URING=0

CMD ["node", "--enable-source-maps", "packages/pds/index.js"]

LABEL org.opencontainers.image.source=https://github.com/bluesky-social/pds
LABEL org.opencontainers.image.description="AT Protocol PDS"
LABEL org.opencontainers.image.licenses=MIT
