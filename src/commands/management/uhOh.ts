import { ChatInputCommandInteraction, EmbedBuilder, Guild, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../typings/index.js';
import { sendBotLog } from '../../helpers.js';

const uhOhCommand: Command = {
    data: new SlashCommandBuilder()
        .addSubcommand(option => 
            option
                .setName('send')
                .setDescription('Send a user to a moderated private channel.')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('The user to moderate.')
                    .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false)
        .setName('uhoh')
        .setDescription('Moves mentioned user to a private channel for moderation discussion.'),
    async execute(interaction: ChatInputCommandInteraction) {
        const subCommand = interaction.options.getSubcommand();

        const user = interaction.options.get('user')?.user;
        if (!user) return interaction.reply({ content: `I have not recieved a user to moderate!`, ephemeral: true });

        const guild = interaction.guild;
        // This should never run but we will do this anyway, command is blocked from dms
        if (!guild) return interaction.reply({ content: `This command must be ran in a guild!`, ephemeral: true })

        sendBotLog(interaction.guild, {
            title: 'test',
            embed: new EmbedBuilder()
                .addFields({
                    name: 'AAAAA',
                    value: 'DDDDD'
                })
        })

        switch(subCommand) {
            case 'send':
                sendToModerated(guild, interaction);
                break;
        }

        return null;
    }
}

// @ts-ignore Ignoring for now since function has not been built
function sendToModerated(guild: Guild, interaction: ChatInputCommandInteraction) {
    
}

export default uhOhCommand;