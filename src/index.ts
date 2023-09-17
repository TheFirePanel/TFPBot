// Import local environment vars from .env
import { config as dotenv } from 'dotenv';
dotenv();

// Default imports
import { getJsFiles } from './helpers.js';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { join,  dirname } from 'node:path';
import { readdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import color from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create client
const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

import { Model } from 'objection';
import pkg from 'knex';
const { knex } = pkg;
import knexConfig from './knexfile.js';

const knexConn = knex(knexConfig.production);

Model.knex(knexConn);

// Import commands
client.commands = new Collection();
const commandFoldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(commandFoldersPath)

for (const folder of commandFolders) {
    const commandsPath = join(commandFoldersPath, folder);
    const commandFiles = getJsFiles(commandsPath);

    for (const file of commandFiles) {
        const filePath: string = join(commandsPath, file);
        const command = await import(pathToFileURL(filePath).href)
            .then((command) => command.default);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(color.green(`Loaded command ${color.bgCyan(command.data.name)}`));
        } else {
            console.log(color.red(`The command at ${color.bgCyan(filePath)} is missing a required "data" or "execute" property.`));
        }
    }
}

// Import util
client.util = new Collection();
const utilFoldersPath = join(__dirname, 'util');
const utilFolders = readdirSync(utilFoldersPath)

for (const folder of utilFolders) {

    const utilPath = join(utilFoldersPath, folder);
    const utilFiles = getJsFiles(utilPath);

    for (const file of utilFiles) {
        const filePath = join(utilPath, file);
        const util = await import(pathToFileURL(filePath).href)
            .then((util) => util.default);;

        if (!util) { continue; }
        
        client.util.set(util.name, util);
        console.log(color.green(`Loaded utility ${color.bgCyan(util.name)}`));
    }
}

// Import events
const eventsPath = join(__dirname, 'events');
const eventFiles = getJsFiles(eventsPath);

for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event = await import(pathToFileURL(filePath).href)
        .then((event) => event.default);
    // Go ahead and calculate used utilities beforehand
    const utilsToRun = client.util.filter((util) => util.event === event.name)

    if (event.once) {
        client.once(event.name, (...args) => {
            event.execute(...args)
            utilsToRun.each((util) => { util.execute(...args); });
        });
    } else {
        client.on(event.name, (...args) => {
            event.execute(...args)
            utilsToRun.each((util) => { util.execute(...args); });
        });
    }

    console.log(color.green(`Loaded event ${color.bgCyan(event.name)}`));
}

// Login to bot account
client.login(process.env.DISCORD_TOKEN);
