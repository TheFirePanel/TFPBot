import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('warnings')
        .addColumn('id', 'uuid', col => col.primaryKey())
        .addColumn('guild_id', 'varchar(255)', col => col.notNull())
        .addColumn('user_id', 'varchar(255)', col => col.notNull())
        .addColumn('mod_id', 'varchar(255)', col => col.notNull())
        .addColumn('reason', 'varchar(255)')
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .dropTable('warnings')
        .execute();
}