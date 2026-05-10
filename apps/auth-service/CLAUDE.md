# CLAUDE.md — apps/auth-service

## Code Structure

- Follow the standard NestJS module pattern: `module → controller → service`.
- Use the local `src/prisma/PrismaService` for database access.
- Use `class-validator` and `class-transformer` for request validation.
- Auth Service is the **gold standard** for NestJS service structure in this repo — when in doubt about patterns, look here first.
- Every controller/DTO needs `@ApiTags` / `@ApiProperty` — OpenAPI specs and typed clients are generated from them.

## Testing

- Unit tests: `*.spec.ts` colocated with source (Vitest, config: `@repo/vitest-config/nestjs`).
- Integration/E2E: `*.e2e-spec.ts` in `test/`. Keep unit and E2E coverage complementary with minimal overlap.

## Documentation

- Every new controller or public API endpoint must have `@ApiTags`, `@ApiOperation`, and `@ApiResponse` decorators — OpenAPI clients are generated from these specs.

## Database

- PostgreSQL, schema: `app_auth`. Prisma schema at `prisma/schema.prisma`.
- After schema changes, remind the user to run `yarn workspace auth-service generate` and update migrations.
