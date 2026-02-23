import { defineConfig } from 'prisma/config';

import 'dotenv/config';

// Migrations must run as a user that can create/modify both app_auth and app_product.
const databaseUrl = process.env['ADMIN_URL'];

if (!databaseUrl) {
  throw new Error(
    'ADMIN_URL environment variable is required for migrations (must have USAGE/CREATE on app_auth and app_product)',
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
