// Writes the OpenAPI document generated from the route schemas to docs/openapi.json.
import { writeFile } from 'node:fs/promises';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db/client.js';

const config = loadConfig({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://unused:unused@localhost:5432/unused',
  JWT_SECRET: 'openapi-export-only-secret-not-used-at-runtime',
});
const { db, pool } = createDb(config.DATABASE_URL);
const app = await buildApp({ config, db });
await app.ready();

const target = new URL('../../../docs/openapi.json', import.meta.url);
await writeFile(target, `${JSON.stringify(app.swagger(), null, 2)}\n`);
await app.close();
await pool.end();
console.log(`OpenAPI spec written to ${target.pathname}`);
