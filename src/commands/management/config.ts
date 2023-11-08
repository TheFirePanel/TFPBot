import {
    codeBlock,
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
    async autocomplete(interaction) {
        if (!interaction.inCachedGuild()) return;

        const subCommand = interaction.options.getSubcommand();
        if (subCommand !== 'set') return;

        const { client, guild } = interaction;

        const config = client
            .getConfig(null, guild.id)
            .map((_, option) => ({ name: option, value: option }));

        await interaction.respond(config)
            .catch(console.error);
    },
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        const subCommand = interaction.options.getSubcommand();

        await interaction.deferReply({ ephemeral: true })
            .catch(console.error);

        switch(subCommand) {
            case 'list':
                await listConfig(interaction);
                break;
            case 'set':
                // await setConfig(interaction);
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
    const configChunks = chunkEntries(configArray, 25);
    
    const embeds: EmbedBuilder[] = [];

    configChunks.forEach((chunk, i) => {
        const page = i + 1;
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTimestamp()
            .setFooter({
                text: `Page ${page}-${configChunks.length}`
            });

        if (page === 1) {
            embed
                .setTitle(`${guild.name} Bot Config`)
                .setDescription('All values are current for this specific guild, to change a value use the command `/config set`.');
        }
        
        chunk.forEach((config) => {
            embed.addFields({
                name: config.option,
                value: codeBlock(config.value)
            });
        });

        embeds.push(embed);
    })

    await interaction.editReply({
        embeds: embeds
    });

    return;
}

/*
async function setConfig(interaction: ChatInputCommandInteraction) {
    const { client, guild } = interaction;
    if (!guild) return;

    const option = interaction.options.get('option', true)
    const value = interaction.options.get('value')

    await client.db
        .selectFrom('configs')
        .select(['guild_id', 'option'])
        .execute()
}*/

export default configCommand;
