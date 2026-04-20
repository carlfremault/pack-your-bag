# CLAUDE.md — apps/product-service

## Code Structure

- Follow the standard NestJS module pattern: `module → controller → service`.
- Use the local `src/prisma/PrismaService` for database access.
- Use `class-validator` and `class-transformer` for request validation.
- Use `apps/auth-service` as the gold standard for structure, exception filters, interceptors, and decorators. Use `packages/nestjs-common` for anything already shared.
- Ensure `main.ts` includes the same security middleware (Helmet, ValidationPipe) as Auth Service.
- Every controller/DTO needs `@ApiTags` / `@ApiProperty` — OpenAPI specs and typed clients are generated from them.
- Exposes `GET /:id/delete-impact` on each resource — always call it in the UI before cascade deletes.

## Testing

- Unit tests: `*.spec.ts` colocated with source (Vitest, config: `@repo/vitest-config/nestjs`).
- Integration/E2E: `*.e2e-spec.ts` in `test/`. Keep unit and E2E coverage complementary with minimal overlap.

## Documentation

- Every new controller or public API endpoint must have `@ApiTags`, `@ApiOperation`, and `@ApiResponse` decorators — OpenAPI clients are generated from these specs.

## Database

- PostgreSQL, schema: `app_product`. Prisma schema at `prisma/schema.prisma`.
- After schema changes, remind the user to run `yarn workspace product-service generate` and update migrations.
