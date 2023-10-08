import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  Migrator,
  type Migration
} from 'kysely';
import { db } from './database.js';
import { getFiles, getFileName } from '../helpers.js';

class FileMigrationProvider {
    public folder: string;
  
    constructor(folder: string) {
        this.folder = folder;
    }
  
    async getMigrations(): Promise<any> {
        const migrations: Record<string, Migration> = {};
        const files = getFiles('./database/migrations');
    
        for await (const file of files) {
            const migration = await import(pathToFileURL(file).href);
            const migrationName = getFileName(file);

            migrations[migrationName] = migration;
        }
    
        return migrations;
    }
  }

export async function migrateToLatest() {
    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider(resolve('./database/migrations')),
      });

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((it) => {
        if (it.status === 'Success') {
            console.log(`Migration "${it.migrationName}" was executed successfully`);
        } else if (it.status === 'Error') {
            console.error(`Failed to execute migration "${it.migrationName}"`);
        }
    })

    if (error) {
        console.error('failed to migrate');
        console.error(error);
        process.exit(1);
    }
}