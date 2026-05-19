FROM node:24-alpine AS base
RUN corepack enable && corepack prepare yarn@4.11.0 --activate
RUN apk add --no-cache libc6-compat

# --- Prune the monorepo for this service ---
FROM base AS pruner
WORKDIR /app
RUN yarn global add turbo@2.6.2
COPY . .
RUN turbo prune user-data-service --docker

# --- Install dependencies (cached layer) ---
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN yarn install --immutable

# --- Build ---
FROM installer AS builder
COPY --from=pruner /app/out/full/ .
RUN yarn turbo run build --filter=user-data-service

# --- Production runner ---
FROM node:24-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/user-data-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

USER nestjs

EXPOSE 8003
ENV NODE_ENV=production

CMD ["node", "dist/src/main"]
