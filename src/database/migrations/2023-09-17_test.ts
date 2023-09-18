import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  console.log(db)
  /*await db.schema
    .createTable('test')
    .addColumn('test', 'text')
    .execute();*/
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable('test')
    .execute();
}