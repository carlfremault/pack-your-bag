import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { expand } from 'dotenv-expand';

const myEnv = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
expand(myEnv);

async function setup() {
  const isLocal = process.env.POSTGRES_HOST === 'localhost';

  const adminConnectionString = process.env.ADMIN_URL;

  if (!adminConnectionString) {
    console.error('❌ Connection failed: ADMIN_URL is missing in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: adminConnectionString });

  const createDbFlag = isLocal ? 'CREATEDB' : '';

  try {
    await client.connect();
    console.log('Connected to Postgres as Admin');

    const authUser = process.env.AUTH_USER || 'auth_user';
    const authPass = process.env.AUTH_PASSWORD;
    const authSchema = process.env.AUTH_SCHEMA || 'app_auth';
    const prodUser = process.env.PRODUCT_USER || 'prod_user';
    const prodPass = process.env.PRODUCT_PASSWORD;
    const prodSchema = process.env.PRODUCT_SCHEMA || 'app_product';

    if (!authPass || !prodPass) {
      throw new Error('User passwords are missing in .env');
    }

    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${authUser}') THEN
          CREATE ROLE ${authUser} WITH LOGIN ${createDbFlag} PASSWORD '${authPass}';
        END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${prodUser}') THEN
          CREATE ROLE ${prodUser} WITH LOGIN ${createDbFlag} PASSWORD '${prodPass}';
        END IF;
      END $$;
    `);

    const dbName = process.env.POSTGRES_DB || 'postgres';
    await client.query(`GRANT CREATE ON DATABASE ${dbName} TO ${authUser};`);
    await client.query(`GRANT CREATE ON DATABASE ${dbName} TO ${prodUser};`);

    await client.query(`CREATE SCHEMA IF NOT EXISTS ${authSchema} AUTHORIZATION ${authUser};`);
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${prodSchema} AUTHORIZATION ${prodUser};`);

    await client.query(`REVOKE ALL ON SCHEMA ${prodSchema} FROM ${authUser};`);
    await client.query(`REVOKE ALL ON SCHEMA ${authSchema} FROM ${prodUser};`);

    console.log('✅ Schemas and Users configured successfully.');
  } catch (err) {
    console.error('❌ Database setup failed:', err);
  } finally {
    await client.end();
  }
}

setup();
