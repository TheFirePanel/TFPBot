import { config as dotenv } from 'dotenv';
dotenv();

import { REST, Routes } from 'discord.js';
import color from 'chalk';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

const commands = [];
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    const arg = process.argv[2]

    if (!arg || !(['true', 'false'].indexOf(arg) >= 0)) { 
        console.log(color.red('You must provide "true" or "false" for the deploy script!'))
        process.exit()
    }

    try {
        console.log(color.magenta(`Started refreshing ${commands.length} application (/) commands.`));

        let data: any;
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
