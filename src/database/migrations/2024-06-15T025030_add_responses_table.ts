import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('responses')
        .addColumn('id', 'uuid', col => col.primaryKey())
        .addColumn('guild_id', 'varchar(255)', col => col.notNull())
        .addColumn('type', 'varchar(255)')
        .addColumn('response_type', 'varchar(255)')
        .addColumn('trigger', 'varchar(255)')
        .addColumn('value', 'varchar(255)')
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .dropTable('responses')
        .execute();
}