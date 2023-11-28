import { config as dotenv } from 'dotenv';
dotenv();

import { REST, Routes } from 'discord.js';
import color from 'chalk';
import { pathToFileURL } from 'node:url';
import { getFiles } from './helpers.js';

const commands = [];
const commandFiles = getFiles('commands')

for (const file of commandFiles) {
    const command = await import(pathToFileURL(file).href)
        .then((command) => command.default);

    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(color.green(`Loaded command ${color.bgCyan(command.data.name)}`));
    } else {
        console.log(color.red(`The command at ${color.bgCyan(file)} is missing a required "data" or "execute" property.`));
    }
}
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    const arg = process.argv[2]

    if (!arg || !(['true', 'false'].indexOf(arg) >= 0)) { 
        console.log(color.red('You must provide "true"(global) or "false"(local) for the deploy script!'))
        process.exit()
    }

    try {
        console.log(color.magenta(`Started refreshing ${commands.length} application (/) commands.`));

        let data: unknown;
        if (arg === 'true') {
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commands },
            );

            console.log(color.bgYellow(`Deploy script set to global deploy, provide false argument for local deployment!`))
        } else {
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
                { body: commands },
            );

            console.log(color.bgYellow(`Deploy script set to local deploy, provide true argument for global deployment!`))
        }

        console.log(color.bgGreen(`Successfully reloaded ${data.length} application (/) commands.`));
    } catch (error) {
        console.error(error);
    }
})();