# CLAUDE.md — apps/user-data-service

## Code Structure

- Follow the standard NestJS module pattern: `module → controller → service`.
- Use `class-validator` and `class-transformer` for request validation.
- Use `apps/auth-service` and `apps/product-service` as gold standards. Use `packages/nestjs-common` for anything already shared.
- Ensure `main.ts` includes the same security middleware (Helmet, ValidationPipe) as Auth Service.
- Every controller/DTO needs `@ApiTags` / `@ApiProperty` — OpenAPI specs and typed clients are generated from them.
- Unlike the other two services, this service uses **Mongoose with MongoDB** (not Prisma/PostgreSQL).

## Testing

- Unit tests: `*.spec.ts` colocated with source (Vitest, config: `@repo/vitest-config/nestjs`).
- Integration/E2E: `*.e2e-spec.ts` in `test/`. Keep unit and E2E coverage complementary with minimal overlap.

## Documentation

- Every new controller or public API endpoint must have `@ApiTags`, `@ApiOperation`, and `@ApiResponse` decorators — OpenAPI clients are generated from these specs.

## Database

- MongoDB via Mongoose. One Preference document per user.
- No migrations — schema evolution is handled at the application level.
