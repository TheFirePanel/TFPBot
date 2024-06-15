import { SlashCommandBuilder, PermissionFlagsBits, type Guild, type ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../typings/index.js';
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

        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case 'add':
                await createReaction(interaction.guild, interaction);
        }
    }
};

async function createReaction(guild: Guild, interaction: ChatInputCommandInteraction) {
    await interaction.client.db
        .insertInto('responses')
        .values({
            id: randomUUID(),
            guild_id: guild.id,
            type: interaction.options.getString('type', true),
            response_type: interaction.options.getString('response_type', true),
            trigger: interaction.options.getString('response_trigger', true),
            value: interaction.options.getString('response_value', true),
        })
        .execute();
}

export default responsesCommand;
