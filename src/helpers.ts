import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EmbedBuilder, TextChannel, MessageCreateOptions } from 'discord.js';
import { BotLogOptions } from './typings/helpers.js';

/**
 * Read a specified directory and grab typescript or javascript files
 * Allows the reading of typescript files for ts-node support
 * @param path Exact path of directory to read
 * @param arrayOfFiles optional, used for recursive option
 */
export function getFiles(path: string, arrayOfFiles?: string[]): string[] {
    const allowedExtensions = [".js", ".ts"];

    const __dirname = dirname(fileURLToPath(import.meta.url));

    const filesPath = join(__dirname, path);
    const files = readdirSync(filesPath);

    let fileArray: string[] = arrayOfFiles || [];
    files.forEach((file) => {
        const filePath: string = join(filesPath, file);

        if (statSync(filePath).isDirectory()) {
            fileArray = getFiles(join(path, file), fileArray);
        } else {
            if (!allowedExtensions.some(extension => file.endsWith(extension))) return;

            fileArray.push(filePath);
        }
    })

    return fileArray;
}

/**
 * Uses regex to remove all file paths to get name of a file if not supplied in a module.
 * @param path Path to parse file name from
 */
export function getFileName(path: string): string {
    return path
        .substring(0, path.lastIndexOf('.'))
        .replace(/^.*(\\|\/|\:)/, '');
}

export function sendBotLog(guild: BotLogOptions['guild'], data: BotLogOptions['data'] = {
        title: 'Bot Log',
        color: 'Red'
    }): void {
        if (!guild) return;

        // Get data and create a constant for easy readability
        const { embed, title, color, attachments } = data
        // Ternary creates a new embed object if not supplied initially
        const embedToSend = (embed ? embed : new EmbedBuilder())
            .setColor(color || 'Red')
            .setTitle(title)
            .setTimestamp()
            .setFooter({ text: `Version ${process.env.version}`});

        const logChannel = (guild.channels.cache.find((channel) => {
            return (channel.name === guild.client.getConfig('botLogsChannel', guild.id) );
        }) as TextChannel);
        if (!logChannel) return;

        // Generate send options
        const sendOptions: MessageCreateOptions = {
            embeds: [embedToSend]
        }
        if (attachments) sendOptions.files = attachments
        
        logChannel.send(sendOptions);
}

export default {};