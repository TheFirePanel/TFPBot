import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../typings/index.js';

const uhOhCommand: Command = {
    data: new SlashCommandBuilder()
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to place in a nice cozy channel.')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false)
        .setName('uhoh')
        .setDescription('Moves mentioned user to a private channel for moderation discussion.'),
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.get('user')?.user
        if (!user) return interaction.reply({ content: `I have not recieved a user to moderate!`, ephemeral: true })

        console.log(user)

        return
    }
}

export default uhOhCommand;