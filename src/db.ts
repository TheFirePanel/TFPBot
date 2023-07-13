import { Sequelize, importModels } from '@sequelize/core';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, process.env.DB_PASSWORD!, {
	hooks: {
		beforeConnect(config) {
			config.host = process.env.DB_HOST!
		},
	},
	dialect: 'mariadb',
	models: await importModels(__dirname + '/**/*.model.{ts,js}'),
	logging: false
})

// It's not recommended to use this on production but their tools are absolutely terrible for automatic seeding
db.sync()

export default db;