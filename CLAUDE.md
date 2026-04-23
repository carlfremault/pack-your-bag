# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Yarn 4 + Turborepo monorepo. Node >=22.6.0.

```
apps/    web (Next.js 16), auth-service, product-service, user-data-service (NestJS)
packages/  db, nestjs-common, react-common, auth-client, product-client, user-data-client, configs
```

## Commands

Single workspace: yarn workspace @repo/<name> <script> for packages, yarn workspace <name> <script> for apps

```bash
yarn dev / build / lint / format

yarn test / test:watch / test:browser

yarn db:init / db:migrate / db:generate / db:seed / db:deploy / db:status

yarn openapi:auth / openapi:product / openapi:user-data          # fetch specs from running services
yarn generate:auth-client / generate:product-client / generate:user-data-client

yarn storybook
```

## Architecture

### BFF Pattern

`apps/web` is the sole browser-facing surface. Its `app/api/` route handlers call the three NestJS services via generated typed clients and attach the `x-bff-secret` header. All three services reject requests missing that header (`BffGuardModule`). **Never use raw `fetch` against microservices** — always use the generated clients from `@repo/auth-client`, `@repo/product-client`, `@repo/user-data-client`.

### Auth Flow

Auth Service issues RS256 JWT access + refresh pairs stored in iron-session HTTP-only cookies. `middleware.ts` transparently refreshes tokens expiring within 30 seconds. Refresh token **family rotation** revokes the entire family if a token is reused (breach detection). Resource services verify tokens via the Auth Service public key — no shared secret.

### NestJS Services

Common infrastructure lives in `@repo/nestjs-common` (JWT strategies, BFF guard, throttler, exception filters, `RequestIdMiddleware`, `@AuditLog`). Auth and Product use PostgreSQL (`app_auth` / `app_product` schemas, scoped DB roles). User Data uses MongoDB.

## Conventions

- **Communication**: succinct and to the point. Pattern: **[thing] [action] [reason]. [next step].**
- **TypeScript**: never use `any`. Respect ESLint strictness.
- **Package manager**: `yarn` only — never `npm` or `pnpm`.
- **Dependencies**: do not add or remove without asking first.
- **Zod v4**: root `package.json` pins it via `resolutions` — use it for all validation schemas.
- **No infrastructure changes**: do not modify `docker-compose.yml`, Turborepo pipeline, or database schemas without explicit instruction.
