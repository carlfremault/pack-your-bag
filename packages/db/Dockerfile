FROM node:24-alpine AS base
RUN corepack enable && corepack prepare yarn@4.11.0 --activate
RUN apk add --no-cache libc6-compat

# --- Prune the monorepo for the db package ---
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo@2.6.2 prune @repo/db --docker

# --- Install dependencies (cached layer) ---
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN yarn install --immutable

# --- Generate Prisma client ---
FROM installer AS builder
COPY --from=pruner /app/out/full/ .
WORKDIR /app/packages/db
ENV POSTGRES_ADMIN_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate

# --- Runner ---
FROM node:24-alpine AS runner
WORKDIR /app/packages/db

COPY --from=builder /app/packages/db .
COPY --from=builder /app/node_modules /app/node_modules

CMD ["sh", "-c", "npx prisma migrate deploy && node --experimental-strip-types prisma/seed.mts"]
