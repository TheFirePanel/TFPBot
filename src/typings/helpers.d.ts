import { EmbedBuilder, Guild, ColorResolvable, Attachment, AttachmentBuilder } from 'discord.js';

interface BotLogOptions {
    guild: Guild,
    data: { 
        title: string,
        color?: ColorResolvable, 
        embed?: EmbedBuilder,
        attachments?: (Attachment | AttachmentBuilder)[]
    }
}