import { SlashCommandBuilder } from 'discord.js';
import { type Command } from '../../typings/index.js';

const pingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        const msg = await interaction.reply({ content: 'Pinging!', fetchReply: true });

        interaction.editReply(`Pong **${msg.createdTimestamp - interaction.createdTimestamp}ms**!`);
    }
}

export default pingCommand;
