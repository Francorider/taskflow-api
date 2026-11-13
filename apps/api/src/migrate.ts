import { loadConfig } from './config.js';
import { runMigrations } from './db/migrate.js';

const config = loadConfig();
await runMigrations(config.DATABASE_URL);
console.log('Migrations applied');
