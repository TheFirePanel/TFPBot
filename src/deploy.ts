import { config as dotenv } from 'dotenv';
dotenv();

import { REST, Routes } from 'discord.js';
import color from 'chalk';
import { pathToFileURL } from 'node:url';
import { getFiles } from './helpers.js';

const commands = [];
const commandFiles = getFiles('commands');

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
    try {
        console.log(color.magenta(`Started refreshing ${commands.length} application (/) commands.`));

        switch (process.env.NODE_ENV) {
            case 'production':
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID!),
                    { body: commands },
                );

                console.log(color.bgGreen(`Node ENV set to production, deployed application commands globally.`));
                break;
            case 'development':
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
                    { body: commands },
                );

                console.log(color.bgGreen(`Node ENV set to development, deployed application commands to guild with ID of ${process.env.GUILD_ID}.`));
                break;
        }
    } catch (error) {
        console.error(error);
    }
})();