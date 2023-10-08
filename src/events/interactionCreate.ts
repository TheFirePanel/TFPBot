import { 
    Events,
    InteractionType,
    type AutocompleteInteraction,
    type BaseInteraction,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { type Command } from '../typings/index.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction: BaseInteraction) {
        switch(interaction.type) {
            case InteractionType.ApplicationCommand:
                if (!interaction.isChatInputCommand()) return;

                handleCommand(interaction, (command, interaction) => {
                    if (!interaction.isChatInputCommand()) return;
                    command.execute(interaction);
                });

                break;
            case InteractionType.ApplicationCommandAutocomplete:
                if (!interaction.isAutocomplete()) return;
                
                handleCommand(interaction, (command, interaction) => {
                    if (!interaction.isAutocomplete() || !command.autocomplete) return;
                    command.autocomplete(interaction);
                })

                break;
        }
    },
};

async function handleCommand(
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
    callback: (
        command: Command,
        interaction: ChatInputCommandInteraction | AutocompleteInteraction) => void
    ) {

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        callback(command, interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
    }
}