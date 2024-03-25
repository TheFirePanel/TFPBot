// Import local environment vars from .env
import { config as dotenv } from 'dotenv';
dotenv();

// This is automatically updated when npm version is ran successfully
process.env.version = '2.0.0';

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
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
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
    ['GLOBAL']: Collection<string, string>
    [key: string]: Collection<string, string>
} = {
    'GLOBAL': new Collection()
};

// Export config values as a type for type checking, guilds will use same keys as they are just overwrites of default values
export const globalConfig = {
    // Log Channels
    'botLogsChannel': 'bot-logs', // sendBotLog
    'joinLeaveChannel': 'join-leave', // joinLeaveLog
    'youtubeWatcherChannel': 'new-videos', // youtubeWatcher

    // Moderation
    'modChatChannel': 'mod-chat', // modmail

    // uhOh
    'moderatedCategory': 'Moderated Channels',
    'moderatedIsolationRole': 'Moderated'
};

for (const [option, value] of Object.entries(globalConfig)) {
    storedConfig['GLOBAL']?.set(option, value);
}

client.refreshConfig = async function() {
    console.log(color.yellow(`Got request to refresh/load config from database`));
    await client.db
        .selectFrom('configs')
        .selectAll()
        .execute()
        .catch(console.error)
        .then((configs) => {
            if (!configs) return;

            // Wipe existing guild configs
            for (const guild in storedConfig) {
                if (guild !== 'GLOBAL') storedConfig[guild] = new Collection();
            }
            
            configs.forEach((config) => {
                if (!config.value) return;

                if (!storedConfig[config.guild_id]) storedConfig[config.guild_id] = new Collection;
                storedConfig[config.guild_id]?.set(config.option, config.value);
            });

            console.log(color.yellow(`Loaded configuration from database`));
        });
};

// Await startup of bot to load configuration from database
await client.refreshConfig()
    .catch(console.error);

/**
 * This command provides a dynamic way of configuring the bot, all guild base config values are stored in database
 * @param option The config option to grab, provide none for all
 * @param guild The guild to get the configuration for
 */
/* eslint @typescript-eslint/no-explicit-any: "off" */
client.getConfig = function (option?: keyof typeof globalConfig | null, guild?: string): any {
    // If no parameters are given return global config
    if (!option && !guild) return storedConfig['GLOBAL'];

    const config = storedConfig[(guild ? guild : 'GLOBAL')];
    // If guild does not have a stored config return global config
    if (!option && guild && !config) return storedConfig['GLOBAL'];

    // If no option is given but guild is return the guild's config merged with the global config
    if (!option && guild) return config 
        ? config
            .merge(
                storedConfig['GLOBAL'],
                _ => ({ keep: false }),
                y => ({ keep: true, value: y }),
                (x, _) => ({ keep: true, value: x })
            )
        : storedConfig['GLOBAL'];

    // We need an option at this point, return if we don't have one
    if (!option) return;

    const configOption = config?.get(option);
    return configOption ? configOption : storedConfig['GLOBAL'].get(option);
};

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
        .then((util) => util.default);

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
            event.execute(...args);
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