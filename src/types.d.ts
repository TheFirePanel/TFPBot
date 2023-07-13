import { Collection, Events, Interaction } from 'discord.js'
import { Sequelize } from '@sequelize/core'

export interface Command {
    data: string,
    execute: (arg0: Interaction) => void
}

export interface Utility {
    name: string,
    event?: Events,
    cache?: { data: any[], [key: string]: any },
    execute: (...args: any) => void
}

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>,
        db: Sequelize,
        util: Collection<string, Utility>,
    }
}
