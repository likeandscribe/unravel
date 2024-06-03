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
RUN turbo prune drainpipe --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY .gitignore .gitignore
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --production --frozen-lockfile


FROM oven/bun:1
WORKDIR /app

WORKDIR /app
COPY --from=installer /app .
COPY --from=installer /app/node_modules ./node_modules

EXPOSE 8080
ENV NODE_ENV=production

CMD ["bun", "run", "packages/drainpipe/src/index.ts"]
