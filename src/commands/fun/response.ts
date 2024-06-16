import { SlashCommandBuilder, PermissionFlagsBits, type Guild, type ChatInputCommandInteraction, Collection } from 'discord.js';
import { Command } from '../../typings/index.js';
import { checkEmoji, embedEntries } from '../../helpers.js';
import { randomUUID } from 'node:crypto';
import { Responses } from '../../typings/database.js';

const responsesCommand: Command = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a response to the guild.')
                .addStringOption(option => 
                    option
                        .setName('type')
                        .setDescription('What type of response is this?')
                        .addChoices(
                            { name: 'word', value: 'word' },
                            { name: 'phrase', value: 'phrase' }
                        )
                        .setRequired(true)
                    )
                .addStringOption(option =>
                    option
                        .setName('response_trigger')
                        .setDescription('What should the response trigger be?')
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option
                        .setName('response_type')
                        .setDescription('What should the reply be?')
                        .addChoices(
                            { name: 'reaction', value: 'reaction' },
                            { name: 'message', value: 'message' }
                        )
                        .setRequired(true)
                    )
                .addStringOption(option =>
                    option
                        .setName('response_value')
                        .setDescription('What should the response be?')
                        .setRequired(true)
                )
            )
        .addSubcommand(option => 
            option
                .setName('list')
                .setDescription('List configured responses in the guild.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a response from the guild.')
                .addStringOption(option => 
                    option
                        .setName('trigger')
                        .setDescription('Trigger string of the response to remove from the guild.')
                        .setRequired(true)
                        .setAutocomplete(true)
                    )
                )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .setName('response')
        .setDescription('Configuration for the response feature!'),
    async autocomplete(interaction) {
        if (!interaction.inCachedGuild()) return;

        const subCommand = interaction.options.getSubcommand();
        if (subCommand !== 'remove') return;

        const { client, guild } = interaction;

        const focusedValue: string = interaction.options.getFocused();
        const guildResponses = client.util.get('autoResponse')?.cache?.responses[guild.id]
            .filter((response: Responses) => 
                String(response.trigger).startsWith(focusedValue)
            )
            .map((response: Responses) => ({ 
                name: `[${String(response.id).substring(0, 8)}] ${response.trigger}`,
                value: response.id 
            }));

        await interaction.respond(guildResponses)
            .catch(console.error);
    },
    async execute(interaction) {
        if (!interaction.channel || !interaction.channel.isTextBased() || !interaction.inCachedGuild()) return;

        // This should never run but we will do this anyway, command is blocked from dms
        if (!interaction.guild) return interaction.reply({ content: `This command must be ran in a guild!`, ephemeral: true })
            .catch(console.error);

        await interaction.deferReply({ ephemeral: true })
            .catch(console.error);

        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case 'add':
                await addResponse(interaction.guild, interaction);
                break;
            case 'list':
                await listResponses(interaction.guild, interaction);
                break;
            case 'remove':
                await removeResponse(interaction.guild, interaction);
                break;
        }

        if (!interaction.replied) {
            interaction.editReply(`Function has completed but no reply was given, please contact a bot administrator.`)
                .catch(console.error);
        }
        
        return;
    }
};

async function addResponse(guild: Guild, interaction: ChatInputCommandInteraction) {
    const responseType = interaction.options.getString('response_type', true);
    const responseValue = interaction.options.getString('response_value', true);
    if (responseType === 'reaction') {
        const validEmoji = checkEmoji(responseValue);
        if (!validEmoji) {
            return interaction.editReply(`Please supply a valid emoji for the reaction.`);
        }
    }

    await interaction.client.db
        .insertInto('responses')
        .values({
            id: randomUUID(),
            guild_id: guild.id,
            type: interaction.options.getString('type', true),
            response_type: responseType,
            trigger: interaction.options.getString('response_trigger', true).toLowerCase(),
            value: responseValue,
        })
        .execute();

    // Tell the utility to refresh the cache
    await interaction.client.util.get('autoResponse')
        ?.refreshCache?.();

    return interaction.editReply(`Response added to guild!`);
}

async function listResponses(guild: Guild, interaction: ChatInputCommandInteraction) {
    const guildResponses: Collection<string, Responses> = interaction.client.util.get('autoResponse')
        ?.cache
        ?.responses[guild.id];
    if (!guildResponses) return interaction.editReply('No configured responses in this guild.');

    const embeds = embedEntries(guildResponses.toJSON(), {
        title: `Responses for ${guild.name}`
    }, (embed, response) => {
        // We only get 25 fields each embed, value is not human readable thanks to mobile
        embed.addFields({
            name: `${response.id}`,
            value: `**🏷️Type**: ${response.type}\n**🪤Trigger**: ${response.trigger}\n**🗣️Response Type**: ${response.response_type}\n**📋Value**: ${response.value}`,
            inline: true
        });
    });
    if (!embeds) return interaction.editReply(`There are no embeds in response, unable to send data.`);

    return interaction.editReply({
        embeds: embeds
    });
}

async function removeResponse(guild: Guild, interaction: ChatInputCommandInteraction) {
    const responseId = interaction.options.get('trigger', true).value as string;
    if (!responseId) return interaction.editReply(`Required values have not been supplied`);

    const removedResponse = await interaction.client.db
        .deleteFrom('responses')
        .where('id', '=', responseId)
        .where('guild_id', '=', guild.id)
        .executeTakeFirst()
        .catch(() => {});
    if (!removedResponse || removedResponse.numDeletedRows <= 0) return interaction.editReply(`A response by the supplied ID was not found, skipping.`);

    // Tell the utility to refresh the cache
    await interaction.client.util.get('autoResponse')
        ?.refreshCache?.();

    return interaction.editReply(`Removed response successfully.`);
}

export default responsesCommand;
