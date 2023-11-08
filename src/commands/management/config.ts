import {
    EmbedBuilder,
    SlashCommandBuilder,
    PermissionFlagsBits,
    type ChatInputCommandInteraction,
} from 'discord.js';
import { type Command } from '../../typings/index.js';
import { chunkEntries } from '../../helpers.js';

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
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        const subCommand = interaction.options.getSubcommand();

        await interaction.deferReply({ ephemeral: true })
            .catch(console.error);

        switch(subCommand) {
            case 'list':
                listConfig(interaction);
                break;
        }

        if (!interaction.replied && interaction.channel) {
            interaction.editReply(`Function has completed but no reply was given, please contact a bot administrator.`)
                .catch(console.error);
        }
    }
}

async function listConfig(interaction: ChatInputCommandInteraction) {
    const { client, guild } = interaction;
    if (!guild) return;

    const configArray = client
        .getConfig(null, guild.id)
        .map((value, option) => ({ option, value }));
    const configChunks: Array<{ option: string, value: string }[]> = chunkEntries(configArray, 2);
    
    const embeds: EmbedBuilder[] = [];

    configChunks.forEach((chunk, i) => {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTimestamp()
            .setFooter({
                text: `Page ${i + 1}-${configChunks.length}`
            });
        
        chunk.forEach((config) => {
            embed.addFields({
                name: config.option,
                value: config.value
            })
        })

        embeds.push(embed)
    })

    interaction.editReply({
        embeds: embeds
    })

    return;
}

export default configCommand;
