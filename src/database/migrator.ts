import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  Migrator,
  Migration
} from 'kysely';
import { db } from './database.js';
import { getJsFiles } from '../helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, './migrations')

class FileMigrationProvider {
    public folder: string;
  
    constructor(folder: string) {
      this.folder = folder;
    }
  
    async getMigrations(): Promise<any> {
      const migrations: Record<string, Migration> = {};
      const files = getJsFiles(migrationsFolder);
  
      for await (const file of files) {
        const migration = await import(
            pathToFileURL(join(migrationsFolder, file)).href
        )
        migrations[migration.name] = migration;
      }
  
      return migrations;
    }
  }

export async function migrateToLatest() {
    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider(resolve('./database/migrations')),
      });

    const { error, results } = await migrator.migrateToLatest()

    results?.forEach((it) => {
        console.log(it)
        if (it.status === 'Success') {
            console.log(`migration "${it.migrationName}" was executed successfully`)
        } else if (it.status === 'Error') {
            console.error(`failed to execute migration "${it.migrationName}"`)
        }
    })

    if (error) {
        console.error('failed to migrate')
        console.error(error)
        process.exit(1)
    }

    await db.destroy()
}