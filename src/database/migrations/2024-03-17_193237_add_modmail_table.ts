import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('modmail')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('guild_id', 'varchar(255)', col => col.notNull())
    .addColumn('user_id', 'varchar(255)')
    .addColumn('dm_channel_id', 'varchar(255)', col => col.notNull())
    .addColumn('message', 'text')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable('modmail')
    .execute();
}