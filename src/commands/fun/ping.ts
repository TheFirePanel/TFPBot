import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import YoutubeChannel from '../../models/youtubeChannel.js'

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction: ChatInputCommandInteraction) {
        const msg = await interaction.reply({ content: 'Pinging!', fetchReply: true });
        
        const channel = await YoutubeChannel.query()

        console.log(channel)

        interaction.editReply(`Pong **${msg.createdTimestamp - interaction.createdTimestamp}ms**!`);
    }
}
