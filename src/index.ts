// Import local environment vars from .env
import { config as dotenv } from 'dotenv';
dotenv();

// This is automatically updated when npm version is ran successfully
process.env.version = '1.1.0';

// Default imports
import { getFiles } from './helpers.js';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { pathToFileURL } from 'node:url';
import color from 'chalk';

// Create client
const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Database imports
import { db } from './database/database.js';
client.db = db;

// Import configs
const dbConfig: {
    [key: string]: Collection<string, string>
} = {}

await client.db
    .selectFrom('configs')
    .selectAll()
    .execute()
    .then((configs) => {
        configs.forEach((config) => {
            if (!config.value) return;

            const configType = (config.guild_id) ? config.guild_id : config.type;
            if (!dbConfig[configType]) dbConfig[configType] = new Collection;

            dbConfig[configType]?.set(config.option, config.value);
            
        })
    })

client.getConfig = function(option, guild) {
    const config = dbConfig[guild ? guild : 'GLOBAL']
    if (!config) return dbConfig['GLOBAL']?.get(option);

    return config.get(option);
}

// #region Auto imports

// Import commands
client.commands = new Collection();
const commandFiles = getFiles('commands');

for (const file of commandFiles) {
    const command = await import(pathToFileURL(file).href)
        .then((command) => command.default);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(color.green(`Loaded command ${color.bgCyan(command.data.name)}`));
    } else {
        console.log(color.red(`The command at ${color.bgCyan(file)} is missing a required "data" or "execute" property.`));
    }
}


// Import util
client.util = new Collection();
const utilFiles = getFiles('util');

for (const file of utilFiles) {
    const util = await import(pathToFileURL(file).href)
        .then((util) => util.default);;

    if (!util) { continue; }
    
    client.util.set(util.name, util);
    console.log(color.green(`Loaded utility ${color.bgCyan(util.name)}`));
}

// Import events
const eventFiles = getFiles('events');

for (const file of eventFiles) {
    const event = await import(pathToFileURL(file).href)
        .then((event) => event.default);
    // Go ahead and calculate used utilities beforehand
    const utilsToRun = client.util.filter((util) => util.event === event.name);

    client[event.once ? 'once' : 'on'](event.name, (...args) => {
        event.execute(...args)
        utilsToRun.each((util) => { util.execute(...args); });
    });

    console.log(color.green(`Loaded event ${color.bgCyan(event.name)}`));
}

// #endregion Auto imports

// Login to bot account
client.login(process.env.DISCORD_TOKEN);
