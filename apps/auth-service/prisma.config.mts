import { defineConfig } from 'prisma/config';

import 'dotenv/config';

const databaseUrl = process.env['AUTH_URL'];

if (!databaseUrl) {
  throw new Error('AUTH_URL environment variable is required');
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
