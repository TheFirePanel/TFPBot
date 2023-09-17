import { config as dotenv } from 'dotenv';
dotenv();

// Production and development might change, but for now use same process
const defaultConfig = {
	client: 'mysql',
	connection: {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	},
	pool: {
		min: 2,
		max: 10
	},
	migrations: {
		tableName: 'knex_migrations',
		directory: './database/migrations'
	},
	seeds: {
		directory: './database/seeds'
	}
}

const config = {
	production: defaultConfig,
	development: defaultConfig,
};

export default config;
