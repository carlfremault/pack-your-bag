FROM node:24-alpine AS base
RUN corepack enable && corepack prepare yarn@4.11.0 --activate
RUN apk add --no-cache libc6-compat

# --- Prune the monorepo for this app ---
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo@2.6.2 prune web --docker

# --- Install dependencies (cached layer) ---
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN yarn install --immutable

# --- Build ---
FROM installer AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
ENV NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=$NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

RUN yarn turbo run build --filter=web

# --- Production runner ---
FROM node:24-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["node", "apps/web/server.js"]
