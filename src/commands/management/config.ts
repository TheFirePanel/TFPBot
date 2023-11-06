import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    // type ChatInputCommandInteraction
} from 'discord.js';
import { type Command } from '../../typings/index.js';

const configCommand: Command = {
    data: new SlashCommandBuilder()
        .addSubcommand(option =>
            option
                .setName('list')
                .setDescription('Display all configuration options and values.')
        )
        .addSubcommand(option =>
            option
                .setName('set')
                .setDescription('Set guild specific configuration value, provide nothing to remove the config.')
                .addStringOption(option => 
                    option
                        .setName('option')
                        .setDescription('The config option to change the value of.')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setDescription('The value to change the config to, dont supply a value to remove config.')  
                        .setRequired(false)
                )
        )
        .setName('config')
        .setDescription('Configures local guild options.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();

        await interaction.deferReply({ ephemeral: true })
            .catch(console.error);

        switch(subCommand) {
            case 'list':
                break;
        }

        if (!interaction.replied && interaction.channel) {
            interaction.editReply(`Function has completed but no reply was given, please contact a bot administrator.`)
                .catch(console.error);
        }
    }
}

/*
async function listConfig(interaction: ChatInputCommandInteraction) {

}
*/

export default configCommand;
