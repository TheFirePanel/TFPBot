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

        const focusedValue: string = interaction.options.getFocused();
        const autoDevices: string[] = cache.autoDevices;
        const filtered: string[] = [];
        
        for (let i = 0, len = autoDevices.length; i < len && filtered.length < 10; i++) {
            const choice = (autoDevices[i] as string);
            if (choice.toLowerCase().startsWith(focusedValue)) {
                filtered.push(choice);
            }
        }

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        ).catch(console.error);
    },
    async execute(interaction) {
        const cache = interaction.client.util.get('simplexModelChecker')?.cache;
        if (!cache) return;

        let foundCategory: string | null = null;
        for (const [category, devices] of Object.entries(cache.devices)) {
            const categoryHas = (devices as string[])
                .some(devices => devices.includes(interaction.options.getString('model')));
            
            if (!categoryHas) return;

            foundCategory = category;
        }

        interaction.reply(foundCategory);
    }
}

export default simplexModelCheckerCommand;