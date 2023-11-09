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
                await setConfig(interaction);
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
                text: `Page ${page}-${configChunks.length} • Version ${process.env.version}`
            });

        if (page === 1) {
            embed
                .setTitle(`${guild.name} Bot Config`)
                .setDescription('All values are current for this specific guild, to change a value use the command `/config set`.');
        }
        
        chunk.forEach((config) => {
            embed.addFields({
                name: `⚙️ ${config.option}`,
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

async function setConfig(interaction: ChatInputCommandInteraction) {
    const { client, guild } = interaction;
    if (!guild) return;

    const option = interaction.options.get('option', true).value;
    const value = interaction.options.get('value')?.value;

    if (typeof option !== 'string' || (typeof value !== 'string' && typeof value !== 'undefined')) {
        return interaction.editReply({
            content: 'You must only supply strings.'
        });
    }

    const configArray: ReadonlyArray<string> = Array.from(client.getConfig(null, guild.id).keys());
    if (!configArray.includes(option)) {
        return interaction.editReply({
            content: 'You must provide a valid config option.'
        })
    }
 
    const existingConfig = await client.db
        .selectFrom('configs')
        .select(({ fn }) => [
            fn.count<number>('option').as('config_count')
        ])
        .where('guild_id', '=', guild.id)
        .where('option', '=', option)
        .executeTakeFirst()
        .then((count) => {
            return (count && count.config_count > 0);
        })
        .catch(console.error);

    if (!value) {
        await client.db
            .deleteFrom('configs')
            .where('guild_id', '=', guild.id)
            .where('option', '=', option)
            .execute()
            .catch(console.error);
    } else if (existingConfig) {
        await client.db
            .updateTable('configs')
            .set({
                value: value
            })
            .where('guild_id', '=', guild.id)
            .where('option', '=', option)
            .execute()
            .catch(console.error);
    } else {
        await client.db
            .insertInto('configs')
            .values({
                guild_id: guild.id,
                option: option,
                value: value
            })
            .execute()
            .catch(console.error);
    }

    await client.refreshConfig()
        .then(async () => {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Config Reloaded')
                .setDescription(`The guild's configuration has been updated and the bot's configuration has been reloaded.`)
                .setTimestamp()
                .setFooter({ text: `Version ${process.env.version}`})
                .addFields(
                    {
                        name: '⚙️ Option',
                        value: codeBlock(option)
                    },
                    {
                        name: '🔮 Value',
                        value: codeBlock(value ? value : 'Reset to default')
                    }
                );

            await interaction.editReply({
                embeds: [embed]
            });
        });

    return;
}

export default configCommand;
