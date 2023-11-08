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
import type { globalConfig } from '../index.ts';

// #region Modules

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>,
        db: Kysely<DB>,
        util: Collection<string, Utility>
        getConfig(): typeof globalConfig, // All global commands
        getConfig(option?: null, guild: string): Collection<string, string>, // All guild commands with global
        getConfig(option?: keyof typeof globalConfig | null, guild?: string): string | undefined, // Specific command with guild
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
    events?: Events | Events[],
    cache?: { [key: string]: Array | Object | string },
    execute: (...args: any, event?: Events) => void
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