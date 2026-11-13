import pg from 'pg';
import { runMigrations } from '../src/db/migrate.js';
import { TEST_DATABASE_URL } from './helpers.js';

/** Creates the test database on first run, then applies migrations. */
export default async function setup(): Promise<void> {
  const url = new URL(TEST_DATABASE_URL);
  const database = url.pathname.slice(1);
  url.pathname = '/postgres';

  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('select 1 from pg_database where datname = $1', [
      database,
    ]);
    if (rowCount === 0) await admin.query(`create database "${database}"`);
  } finally {
    await admin.end();
  }

  await runMigrations(TEST_DATABASE_URL);
}
