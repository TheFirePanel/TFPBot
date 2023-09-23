import { EmbedBuilder, SlashCommandBuilder, codeBlock } from 'discord.js';
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
        const modelString = interaction.options.getString('model');

        if (!cache || !modelString) return;

        let foundCategory: string | null = null;
        for (const [category, devices] of Object.entries(cache.devices)) {
            const categoryHas = (devices as string[])
                .some(devices => devices.includes(modelString));
            
            if (categoryHas) {
                foundCategory = category;
            }
        }

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Simplex Model Number Checker')
            .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp()
            .setFooter({ text: `Version ${process.env.npm_package_version}`});

        if (!foundCategory) return interaction.reply({
            embeds: [
                embed.addFields(
                    { 
                        name: '😕 Not Found',
                        value: codeBlock(`Unable to find "${modelString}", if this should be on the list then please visit the github repository and open an issue or pull request`)
                    },
                    {
                        name: '💻 GitHub',
                        value: '[GitHub Repository](https://github.com/TheFirePanel/SimplexModelChecker)'
                    }
                )
            ]
        });

        const deviceDescriptions: { [key: string]: string } = {
            'freerun': `When power is applied, both the horn and strobe will run`,
            'selectable': `When power is applied, the horn will run always. The strobe can flash on it's own, or with SmartSync depending on a DIP Switch setting`,
            'syncable': `Horn will operate when power is applied, but strobe will only flash when power is removed`,
            'smartsync': `Requires a compatible Simplex Panel, or a SmartSync module such as the 4905-9938 to operate Horn or Strobe`,
            'addressable': `For use only with high-end Simplex Panels, such as the 4100U`,
            'es': `Requires a Simplex 4007ES, 4010ES, or 4100ES for operation`
        }

        return interaction.reply({
            embeds: [
                embed.addFields(
                    { name: '📦 Model', value: codeBlock(modelString) },
                    { name: '📊 Type', value: codeBlock(`${foundCategory.toUpperCase()}\n${deviceDescriptions[foundCategory.toLowerCase()]}`)},
                    { 
                        name: '☹️ Missing something?', 
                        value: 'Feel free to open an issue or a pull request on our [github repository](https://github.com/TheFirePanel/SimplexModelChecker)!' 
                    }
                )
            ]
        });
    }
}

export default simplexModelCheckerCommand;