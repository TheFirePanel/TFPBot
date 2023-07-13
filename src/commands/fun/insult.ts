import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const insults: string[] = ['Putting this %s mid sentence to test replace reply. %s %s'];

export default {
    data: new SlashCommandBuilder()
        .setName('insult')
        .setDescription('Provides the mentioned user with an insult!')
        .addUserOption(option => option.setName('user')
            .setDescription('User to insult!')
            .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.get('user')?.user
        if (!user) return interaction.reply({ content: `I have not recieved a user to insult!`, ephemeral: true })

        const insult = insults[Math.floor(insults.length * Math.random())];
        if (!insult) return interaction.reply({ content: `I have no insults to give!`, ephemeral: true });

        return interaction.reply(insult.replace(/%s/g, user.toString()))
    }
}
