import { defineConfig } from 'prisma/config';

import 'dotenv/config';

// For migrations, we need to use AUTH_URL as the default connection
// Individual services will use their own connection strings when instantiating PrismaClient
const databaseUrl = process.env['AUTH_URL'];

if (!databaseUrl) {
  throw new Error('AUTH_URL environment variable is required for migrations');
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
