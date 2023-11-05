import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { type Command } from '../../typings/index.js';

const configCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configures local guild options.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute() {
    }
}

export default configCommand;
