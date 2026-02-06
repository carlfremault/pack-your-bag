import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { expand } from 'dotenv-expand';

const isTest = process.env.NODE_ENV === 'test';
const envFile = isTest ? '.env.test' : '.env';
const myEnv = dotenv.config({ path: path.resolve(process.cwd(), envFile) });
expand(myEnv);

async function setup() {
  const isLocal = process.env.POSTGRES_HOST === 'localhost';
  const adminUrl = process.env.ADMIN_URL;
  const targetDbName = isTest
    ? process.env.POSTGRES_TEST_DB || 'packyourbag_test'
    : process.env.POSTGRES_DB || 'postgres';

  if (!adminUrl) {
    console.error('❌ Connection failed: ADMIN_URL is missing in .env');
    process.exit(1);
  }

  // STEP 1: Admin Connection to handle DB creation
  const adminClient = new Client({ connectionString: adminUrl });
  try {
    await adminClient.connect();
    if (isTest) {
      // Disconnect other users before dropping test database (useful if a test crashed and left a connection open)
      await adminClient.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${targetDbName}' AND pid <> pg_backend_pid();
      `);
      await adminClient.query(`DROP DATABASE IF EXISTS ${targetDbName};`);
      await adminClient.query(`CREATE DATABASE ${targetDbName};`);
      console.log(`✅ Created test database: ${targetDbName}`);
    } else {
      const dbCheck = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = '${targetDbName}'`,
      );

      if (dbCheck.rowCount === 0) {
        await adminClient.query(`CREATE DATABASE ${targetDbName};`);
        console.log(`✅ Created database: ${targetDbName}`);
      }
    }
  } catch (err) {
    console.error('❌ Admin connection failed:', err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // STEP 2: Connect to the relevant target database to configure schemas/users
  const targetUrl = isTest ? process.env.ADMIN_TEST_URL : process.env.ADMIN_URL;
  if (!targetUrl) {
    console.error('❌ Connection failed: Target database URL is missing in .env');
    process.exit(1);
  }
  const client = new Client({ connectionString: targetUrl });

  // The CREATEDB privilege is needed for Prisma 'migrate dev' to spin up Shadow Databases locally.
  // In production, we use 'migrate deploy' which doesn't require this privilege.
  // Furthermore, managed DB providers often block this flag for non-superuser roles. Trying to grant it would make deployment fail.
  const createDbFlag = isLocal ? 'CREATEDB' : '';

  try {
    await client.connect();
    console.log(`Connected to ${targetDbName} as Admin.`);

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
      ELSE
        ALTER ROLE ${authUser} WITH LOGIN ${createDbFlag} PASSWORD '${authPass}';
      END IF;
      
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${prodUser}') THEN
        CREATE ROLE ${prodUser} WITH LOGIN ${createDbFlag} PASSWORD '${prodPass}';
      ELSE
        ALTER ROLE ${prodUser} WITH LOGIN ${createDbFlag} PASSWORD '${prodPass}';
      END IF;
    END $$;
    `);

    await client.query(`GRANT CREATE ON DATABASE ${targetDbName} TO ${authUser};`);
    await client.query(`GRANT CREATE ON DATABASE ${targetDbName} TO ${prodUser};`);

    await client.query(`CREATE SCHEMA IF NOT EXISTS ${authSchema} AUTHORIZATION ${authUser};`);
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${prodSchema} AUTHORIZATION ${prodUser};`);

    await client.query(`REVOKE ALL ON SCHEMA ${prodSchema} FROM ${authUser};`);
    await client.query(`REVOKE ALL ON SCHEMA ${authSchema} FROM ${prodUser};`);

    console.log('✅ Schemas and Users configured successfully');
  } catch (err) {
    console.error('❌ Database setup failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
