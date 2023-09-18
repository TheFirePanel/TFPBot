import { config as dotenv } from 'dotenv';
dotenv();

import { DB } from 'kysely-codegen';
import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';
import { migrateToLatest } from './migrator.js';

const dialect = new MysqlDialect({
  pool: createPool(process.env.DATABASE_URL!)
});

export const db = new Kysely<DB>({
  dialect,
});

migrateToLatest();