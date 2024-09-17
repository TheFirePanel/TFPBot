import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Collection,
    Events,
    SlashCommandBuilder
} from 'discord.js';
import type {
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
        getConfig(option?: null, guild: string): Collection<keyof typeof globalConfig , string>, // All guild commands with global
        getConfig(option?: keyof typeof globalConfig | null, guild?: string): string | undefined, // Specific command with guild
        refreshConfig(): Promise<void>
    }
}

// #endregion Modules

// #region Interfaces

export interface Command {
    data: SlashCommandBuilder<undefined>,
    autocomplete?: (arg0: AutocompleteInteraction) => void,
    execute: (arg0: ChatInputCommandInteraction) => void
}

export interface Utility {
    name: string,
    events?: Events | Events[],
    cache?: {
        [key: string]: Array | object | string
        refresh?: boolean
    },
    refreshCache?: () => Promise<void> | void,
    execute: (...args: any, event?: Events) => void
}

// #endregion Interfaces

// #region General Types

type NumericRange<
  start extends number,
  end extends number,
  arr extends unknown[] = [],
  acc extends number = never,
> = arr['length'] extends end
  ? acc | start | end
  : NumericRange<start, end, [...arr, 1], arr[start] extends undefined ? acc : acc | arr['length']>;

// #endregion General Types