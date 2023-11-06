// Import local environment vars from .env
import { config as dotenv } from 'dotenv';
dotenv();

// This is automatically updated when npm version is ran successfully
process.env.version = '1.3.1';

// Default imports
import {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
} from 'discord.js';
import { getFiles } from './helpers.js';
import { pathToFileURL } from 'node:url';
import color from 'chalk';

// Create client
const client: Client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

// Database imports
import { db } from './database/database.js';
client.db = db;

// #region Bot settings logic

// Grab configurations from the database
const storedConfig: {
    [key: string]: Collection<string, string>
} = {}

// Export config values as a type for type checking, guilds will use same keys as they are just overwrites of default values
export const globalConfig = {
    // Log Channels
    'botLogsChannel': 'bot-logs', // sendBotLog
    'joinLeaveChannel': 'join-leave', // joinLeaveLog
    'youtubeWatcherChannel': 'new-videos', // youtubeWatcher

    // uhOh
    'moderatedCategory': 'Moderated Channels',
    'moderatedIsolationRole': 'Moderated'
}

storedConfig['GLOBAL'] = new Collection();
for (const [option, value] of Object.entries(globalConfig)) {
    storedConfig['GLOBAL']?.set(option, value)
}

client.refreshConfig = async function() {
    await client.db
        .selectFrom('configs')
        .selectAll()
        .execute()
        .catch(console.error)
        .then((configs) => {
            if (!configs) return;
            
            configs.forEach((config) => {
                if (!config.value) return;

                if (!storedConfig[config.guild_id]) storedConfig[config.guild_id] = new Collection;
                storedConfig[config.guild_id]?.set(config.option, config.value);
            })
        })
}

console.log(color.yellow(`Loading configuration from database`))
await client.refreshConfig()
    .catch(console.error)
    .then(() => {
        console.log(color.yellow(`Loaded configuration from database, continuing startup`))
    });

client.getConfig = function (option?: keyof typeof globalConfig, guild?: string): any {
    if (!option) return globalConfig;

    const config = storedConfig[(guild ? guild : 'GLOBAL')]
    if (!config?.get(option)) return storedConfig['GLOBAL']?.get(option);

    return config.get(option);
}

// #endregion Bot settings logic

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
    const utilsToRun = client.util.filter((util) => util.events?.includes(event.name));

    client[event.once ? 'once' : 'on'](event.name, (...args) => {
        // The event file execute itself
        try {
            event.execute(...args)
        } catch(e) {
            console.error(e);
        }

        // The utilities that are tied to this event
        utilsToRun.each((util) => { 
            try {
                util.execute(...args, event.name);
            } catch(e) {
                console.error(e);
            }
        });
    });

    console.log(color.green(`Loaded event ${color.bgCyan(event.name)}`));
}
// #endregion Auto imports

// Login to bot account
client.login(process.env.DISCORD_TOKEN);
