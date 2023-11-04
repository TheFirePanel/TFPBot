import { SlashCommandBuilder } from 'discord.js';
import { type Command } from '../../typings/index.js';

const insults: string[] = ['%s looks like an EST fan.'];

const insultCommand: Command = {
    data: new SlashCommandBuilder()
        .addUserOption(option => 
            option
                .setName('user')
                .setDescription('User to insult!')
                .setRequired(true)
            )
        .setName('insult')
        .setDescription('Provides the mentioned user with an insult!'),
    async execute(interaction) {
        const user = interaction.options.get('user')?.user
        if (!user) return interaction.reply({ content: `I have not recieved a user to insult!`, ephemeral: true })

        const insult = insults[Math.floor(insults.length * Math.random())];
        if (!insult) return interaction.reply({ content: `I have no insults to give!`, ephemeral: true });

        return interaction.reply(insult.replace(/%s/g, user.toString()))
    }
}

export default insultCommand;