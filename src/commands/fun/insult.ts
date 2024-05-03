import { SlashCommandBuilder } from 'discord.js';
import { type Command } from '../../typings/index.js';

/**
 * Placeholders
 * %s mentioned user
 * %u user that used the command
 */
const insults: string[] = [
    '%s looks like an EST fan.',
    `%u rizzed up %s's mom last night.`,
    `%s My days of not taking you seriously have come to a middle.`,
    '%s has a face for radio.',
    'If %s was a spice, they would be flour',
    '%s May your life be as pleasant as you are',
    '%s May the chocolate chips in your cookies always turn out to be raisins',
    `%s Sometimes it's better to keep your mouth shut and let people think you're silly than open it and confirm their suspicions`,
    '%s I bet your pH level is 14, because ya basic.',
    '%s https://tenor.com/view/14699957714023232752',
    'I'm not sure what is higher; the Minecraft 1.18 height update, or %s's ego.'
];

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
        const user = interaction.options.get('user')?.user;
        if (!user) return interaction.reply({ content: `I have not recieved a user to insult!`, ephemeral: true });

        const insult = insults[Math.floor(insults.length * Math.random())];
        if (!insult) return interaction.reply({ content: `I have no insults to give!`, ephemeral: true });

        return interaction.reply(
            insult
                .replace(/%s/g, user.toString())
                .replace(/%u/g, interaction.user.toString())
        );
    }
};

export default insultCommand;
