import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    AttachmentBuilder,
    EmbedBuilder,
    parseEmoji
} from 'discord.js';
import type {
    Attachment,
    ColorResolvable,
    MessageCreateOptions,
    Guild,
    GuildBasedChannel,
    Message,
    FetchMessagesOptions,
} from 'discord.js';
import { NumericRange } from './typings/index.js';

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
    });

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

/**
 * Send a message in a configured channel for what happens with the bot in a specific guild.
 * @param guild The guild to send the bot log in
 * @param data Data of what to send in the log message
 * @returns void
 */
export function sendBotLog(guild: Guild, data: { 
    title: string,
    color?: ColorResolvable, 
    embed?: EmbedBuilder,
    attachments?: (Attachment | AttachmentBuilder)[]
} = {
        title: 'Bot Log',
        color: 'Red'
    }): void {
        if (!guild) return;

        // Get data and create a constant for easy readability
        const { embed, title, color, attachments } = data;
        // Ternary creates a new embed object if not supplied initially
        const embedToSend = (embed ? embed : new EmbedBuilder())
            .setColor(color || 'Red')
            .setTitle(title)
            .setTimestamp()
            .setFooter({ text: `Version ${process.env.version}`});

        const channelName = guild.client.getConfig('botLogsChannel', guild.id);
        const logChannel = guild.channels.cache.find((channel) => {
            return (channel.name === channelName);
        });
        if (!logChannel || !logChannel.isTextBased()) return;

        // Generate send options
        const sendOptions: MessageCreateOptions = {
            embeds: [embedToSend]
        };
        if (attachments) sendOptions.files = attachments;
        
        logChannel.send(sendOptions);
}

/**
 * Mainly used for uhOh command, this function provides the ability to archive a channel's content into a txt file or array.
 * @param channel Guild channel to get message content of
 * @param options Currently houses options like max limit and attachment creation
 */
export async function archiveMessages(channel: GuildBasedChannel, options: { limit?: number, attachment?: { name: string } }): Promise<AttachmentBuilder>;
export async function archiveMessages(channel: GuildBasedChannel, options: { limit?: number }): Promise<Message[]>;
export async function archiveMessages(channel: GuildBasedChannel, options: any) {
    if (!channel.isTextBased()) return;
    const { attachment, limit } = options;

    const archivedMessages: Message[] = [];
    let last_id;

    for (;;) {
        const options: FetchMessagesOptions = {
            limit: 100
        };
        if (last_id) options.before = last_id;

        const messages = await channel.messages.fetch(options)
            .catch(console.error);
        if (!messages) break;
        
        archivedMessages.push(...messages.values());
        last_id = messages.last()?.id;

        if (messages.size != 100 || archivedMessages.length >= (limit || 500)) break;
    }

    if (attachment) {
        const formattedData = archivedMessages
            .map(message => `[${message.createdAt.toLocaleString()}] ${message.author.displayName}(${message.author.id}) : ${message.cleanContent}`)
            .reverse()
            .join('\n');

        if (formattedData.length <= 0) return null;

        return new AttachmentBuilder(Buffer.from(formattedData, 'utf-8'), { name: `${attachment.name}.txt` });
    }
    return archivedMessages;
}

/**
 * Divides up supplied array into configurable chunks, can be used for pagination or to get around embed field limit
 * @param array Given array to split up
 * @param chunkSize The amount of entries to have in each chunk
 */
export function chunkEntries<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        chunks.push(chunk);
    }

    return chunks;
}

/**
 * Divides up supplied array and sends the data into multiple configurable embeded objects
 * @param array Given array to split up
 * @param forEach The function to run on each individual chunk
 */
export function embedEntries<T>(array: T[], options: {
    title: string,
    description?: string,
    chunkSize?: NumericRange<1, 25>
    color?: ColorResolvable
}, forEach: (embed: EmbedBuilder, chunk: T) => void): EmbedBuilder[] {
    const { title, description, chunkSize, color } = options;
    const chunks = chunkEntries(array, chunkSize || 25);

    const embeds: EmbedBuilder[] = [];

    chunks.forEach((chunk, i) => {
        const page = i + 1;
        const embed = new EmbedBuilder()
            .setColor(color || 'Red')
            .setTimestamp()
            .setFooter({
                text: `Page ${page}-${chunks.length} • Version ${process.env.version}`
            });
            
        if (page === 1) {
            embed
                .setTitle(title)
                .setDescription(description || null);
        }

        chunk.forEach((chunk) => forEach(embed, chunk));

        embeds.push(embed);
    });
    
    return embeds;
}

/**
 * Validates if string contains an emoji, works with unicode and discord emojis
 * @param text The string to validate
 * @example 
 * const validEmoji = checkEmoji('🔥'); // true
 * const validEmoji = checkEmoji('test'); // false
 */
export function checkEmoji(text: string): boolean {
    const discordEmoji = parseEmoji(text);
    if (discordEmoji?.id) return true;

    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji}\u200D\p{Emoji}|\p{Extended_Pictographic})+$/u;
    return emojiRegex.test(text);
}

/**
 * Validates if string is a url.
 * @param url The url to validate
 * @example
 * const validUrl = checkUrl('https://ebay.com') // true
 * const validUrl = checkUrl('yooo') // false
 */
export function checkUrl(url: string): boolean {
    const urlRegex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s]*$/i;
    return urlRegex.test(url);
}

export default {};