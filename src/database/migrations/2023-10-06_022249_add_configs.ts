import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('configs')
    .addColumn('type', 'varchar(255)', col => col.notNull())
    .addColumn('guild_id', 'varchar(255)')
    .addColumn('option', 'varchar(255)', col => col.notNull())
    .addColumn('value', 'varchar(255)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable('configs')
    .execute();
}