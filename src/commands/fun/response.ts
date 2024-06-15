import { SlashCommandBuilder, PermissionFlagsBits, type Guild, type ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../typings/index.js';
import { checkEmoji } from '../../helpers.js';
import { randomUUID } from 'node:crypto';

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
                            { name: 'Word', value: 'word' },
                            { name: 'Phrase', value: 'phrase' }
                        )
                        .setRequired(true)
                    )
                    .addStringOption(option => 
                        option
                            .setName('response_type')
                            .setDescription('What should the reply be?')
                            .addChoices(
                                { name: 'Reaction', value: 'reaction' },
                                { name: 'Message', value: 'message' }
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
                            .setName('response_value')
                            .setDescription('What should the response be?')
                            .setRequired(true)
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a response from the guild.')
                .addStringOption(option => 
                    option
                        .setName('response_id')
                        .setDescription('ID of the response to remove from the guild.')
                        .setRequired(true)
                    )
                )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .setName('response')
        .setDescription('Configuration for the response feature!'),
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
            trigger: interaction.options.getString('response_trigger', true),
            value: responseValue,
        })
        .execute();
    
    // Tell the utility to refresh the cache
    const cache = interaction.client.util.get('autoResponse')?.cache;
    if (cache) cache.refresh = true;

    return interaction.editReply(`Response added to guild!`);
}

export default responsesCommand;