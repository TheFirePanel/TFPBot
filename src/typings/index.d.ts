import { AutocompleteInteraction, ChatInputCommandInteraction, Collection, Events, SlashCommandBuilder } from 'discord.js';
import { ColumnType, Kysely } from 'kysely';
import { DB } from './database.js';

export interface Command {
    data: SlashCommandBuilder,
    autocomplete?: (arg0: AutocompleteInteraction) => void,
    execute: (arg0: ChatInputCommandInteraction) => void
}

export interface Utility {
    name: string,
    event?: Events,
    cache?: { [key: string]: Array | Object | string },
    execute: (...args: any) => void,
}

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>,
        db: Kysely<DB>,
        util: Collection<string, Utility>,
    }
}