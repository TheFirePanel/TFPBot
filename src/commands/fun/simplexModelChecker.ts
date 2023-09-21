import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../typings/index.js';

const simplexModelCheckerCommand: Command = {
    data: new SlashCommandBuilder()
        .addStringOption(option =>
            option
                .setName('model')
                .setDescription('The model of the item in question.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .setName('smc')
        .setDescription('Responds with simplex model type.'),
    async autocomplete(interaction) {
        const cache = interaction.client.util.get('simplexModelChecker')?.cache
        if (!cache) return;

        const focusedValue = interaction.options.getFocused();
        const devices: string[] = Object.values(cache.models).flatMap((arr) => (arr as string));
        const filtered: string[] = devices
            .filter((choice) => (choice as string)
            .startsWith(focusedValue))
            .slice(0, 20);

		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    },
    async execute(interaction) {
        console.log('execute', interaction);
    }
}

export default simplexModelCheckerCommand;