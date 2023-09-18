import { config as dotenv } from 'dotenv';
dotenv();

import { DB } from './types.js';
import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';
import { migrateToLatest } from './migrator.js';

const dialect = new MysqlDialect({
    pool: createPool({
        database: process.env.DB_NAME!,
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
    })
});

export const db = new Kysely<DB>({
    dialect,
});

migrateToLatest();