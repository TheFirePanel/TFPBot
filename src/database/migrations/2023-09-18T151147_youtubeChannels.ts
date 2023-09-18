import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('youtube_channels')
    .addColumn('channel_id', 'varchar(255)', col => col.primaryKey())
    .addColumn('guild_id', 'varchar(255)', col => col.notNull())
    .addColumn('latest_video', 'varchar(255)')
    .addColumn('added_by', 'varchar(255)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable('youtube_channels')
    .execute();
}