import { defineConfig } from 'prisma/config';

import 'dotenv/config';

const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env['POSTGRES_TEST_DB']);

// Migrations must run as a user that can create/modify both app_auth and app_product.
const databaseUrl = isTest
  ? process.env['POSTGRES_ADMIN_TEST_URL']
  : process.env['POSTGRES_ADMIN_URL'];

if (!databaseUrl) {
  const requiredVar = isTest ? 'POSTGRES_ADMIN_TEST_URL' : 'POSTGRES_ADMIN_URL';
  throw new Error(`${requiredVar} is required`);
}

if (isTest && databaseUrl === process.env['POSTGRES_ADMIN_URL']) {
  throw new Error('Refusing to run tests against POSTGRES_ADMIN_URL; set POSTGRES_ADMIN_TEST_URL');
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
