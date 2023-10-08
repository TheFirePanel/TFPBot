import type {
    AutocompleteInteraction,
    Attachment,
    AttachmentBuilder ,
    ChatInputCommandInteraction,
    Collection,
    ColorResolvable,
    EmbedBuilder,
    Events,
    Guild,
    SlashCommandBuilder
} from 'discord.js';
import type {
    ColumnType,
    Kysely
} from 'kysely';
import type { DB } from './database.js';

// #region Modules

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>,
        db: Kysely<DB>,
        util: Collection<string, Utility>
        getConfig(option: string, guild?: string): string | undefined,
        refreshConfig(): Promise<void>
    }
}

// #endregion Modules

// #region Interfaces

export interface Command {
    data: SlashCommandBuilder,
    autocomplete?: (arg0: AutocompleteInteraction) => void,
    execute: (arg0: ChatInputCommandInteraction) => void
}

export interface Utility {
    name: string,
    event?: Events,
    cache?: { [key: string]: Array | Object | string },
    execute: (...args: any) => void
}

export interface BotLogOptions {
    guild: Guild,
    data: { 
        title: string,
        color?: ColorResolvable, 
        embed?: EmbedBuilder,
        attachments?: (Attachment | AttachmentBuilder)[]
    }
}

// #endregion Interfaces