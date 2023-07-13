import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction: ChatInputCommandInteraction) {
        const msg = await interaction.reply({ content: 'Pinging!', fetchReply: true });
        interaction.editReply(`Pong **${msg.createdTimestamp - interaction.createdTimestamp}ms**!`);
    }
}
