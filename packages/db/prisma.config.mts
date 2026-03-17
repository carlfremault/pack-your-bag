import { defineConfig } from 'prisma/config';

import 'dotenv/config';

// Migrations must run as a user that can create/modify both app_auth and app_product.
const databaseUrl = process.env['POSTGRES_ADMIN_TEST_URL'] ?? process.env['POSTGRES_ADMIN_URL'];

if (!databaseUrl) {
  throw new Error(
    'POSTGRES_ADMIN_TEST_URL (for test) or POSTGRES_ADMIN_URL (for dev/prod) is required for migrations (must have USAGE/CREATE on app_auth and app_product)',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --experimental-strip-types prisma/seed.mts',
  },
  datasource: {
    url: databaseUrl,
  },
});
