import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { type Command } from '../../typings/index.js';

const configCommand: Command = {
    data: new SlashCommandBuilder()
        .addSubcommand(option =>
            option
                .setName('get')
                .setDescription('Get current configuration value from supplied config option.')
                .addStringOption(option => 
                    option
                        .setName('option')
                        .setDescription('The config option to get the value for.')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
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
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const filtered: string[] = [];
        const config = interaction.client.getConfig();

        for (const key in config) {
            if (key.startsWith(focusedValue)) {
                filtered.push(key);
            }
        }

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        ).catch(console.error);
    }, 
    async execute() {
    }
}

export default configCommand;
