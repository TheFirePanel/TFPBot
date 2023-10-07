import { ChatInputCommandInteraction, EmbedBuilder, Guild, PermissionFlagsBits, SlashCommandBuilder, User } from 'discord.js';
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
                .addBooleanOption(option => option
                    .setName('isolate')
                    .setDescription('Give user a role that disallows access to the discord?')
                )
        )
        .addSubcommand(option => 
            option
                .setName('release')
                .setDescription('Release a user from a moderated channel.')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('The user to release.')
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

        switch(subCommand) {
            case 'send':
                sendToModerated(guild, user, interaction);
                break;
        }

        return interaction.reply(`Sending reply to statisfy`);
    }
}

async function sendToModerated(guild: Guild, user: User, interaction: ChatInputCommandInteraction) {
    const channel = await guild.channels.create({
        name: `moderated-${user.displayName}`,
        reason: `Sent to moderated chanel by ${interaction.user.displayName}`,
        permissionOverwrites: [
            {
                id: user.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
            }
        ]
    }).catch(console.error)
    if (!channel) return;

    await interaction.client.db
        .insertInto('mod_channels')
        .values({
            channel_id: channel.id,
            guild_id: guild.id,
            user_id: user.id,
            added_by: interaction.user.id
        })
        .execute()
        .catch(console.error);

    sendBotLog(guild, {
        title: 'User sent to moderated channel',
        embed: new EmbedBuilder()
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .addFields(
                {
                    name: '📜Channel',
                    value: `<#${channel.id}>`,
                    inline: true
                },
                {
                    name: '🙍User',
                    value: `<@${user.id}>`,
                    inline: true
                },
                {
                    name: '🛡️Staff Member',
                    value: `<@${interaction.user.id}>`
                }
            )
    })
}

export default uhOhCommand;