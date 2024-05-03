import { SlashCommandBuilder } from 'discord.js';
import { type Command } from '../../typings/index.js';

/**
 * Placeholders
 * %s mentioned user.
 * %u user that used the command.
 */
const insults: { [key: string]: { text: string } } = {
    'est': {
        text: '%s looks like an EST fan.'
    },
    'rizz': {
        text: `%u rizzed up %s's mom last night.`
    },
    'taking_seriously': {
        text: `%s My days of not taking you seriously have come to a middle.`
    },
    'radio': {
        text: '%s has a face for radio.'
    },
    'spicy_flour': {
        text: 'If %s was a spice, they would be flour'
    },
    'pleasant': {
        text: '%s May your life be as pleasant as you are'
    },
    'cookies': {
        text: '%s May the chocolate chips in your cookies always turn out to be raisins'
    },
    'mouth_shut': {
        text: `%s Sometimes it's better to keep your mouth shut and let people think you're silly than open it and confirm their suspicions`
    },
    'ph': {
        text: '%s I bet your pH level is 14, because ya basic.'
    },
    'mew': {
        text: '%s https://tenor.com/view/14699957714023232752'
    },
    'minecraft': {
        text: `I'm not sure what is higher; the Minecraft 1.18 height update, or %s's ego.`
    }
};

const insultCommand: Command = {
    data: new SlashCommandBuilder()
        .addUserOption(option => 
            option
                .setName('user')
                .setDescription('User to insult!')
                .setRequired(true)
            )
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Name of a specific insult, for random insult leave option blank.')
                .setAutocomplete(true)
        )
        .setName('insult')
        .setDescription('Provides the mentioned user with an insult!'),
    async autocomplete(interaction) {
        if (!insults) return;

        const focusedValue: string = interaction.options.getFocused();
        const filtered = Object.keys(insults).filter((key) => key.startsWith(focusedValue));

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        ).catch(console.error);
    },
    async execute(interaction) {
        const user = interaction.options.get('user')?.user;
        if (!user) return interaction.reply({ content: `I have not recieved a user to insult!`, ephemeral: true });

        const selectedInsult = interaction.options.get('name')?.value as string;
        const insultKey = selectedInsult
            ? selectedInsult
            : Object.keys(insults)[Math.floor(Math.random() * Object.keys(insults).length)];

        if (!insultKey) return interaction.reply({ content: 'Insult key not supplied.', ephemeral: true});

        const insult = insults[insultKey];
        if (!insult) return interaction.reply({ content: `Invalid insult name, or no insults exist!`, ephemeral: true });

        return interaction.reply(
            insult.text
                .replace(/%s/g, user.toString())
                .replace(/%u/g, interaction.user.toString())
        );
    }
};

export default insultCommand;
