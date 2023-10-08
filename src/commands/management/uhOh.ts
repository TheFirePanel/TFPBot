import { 
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type CommandInteractionOption,
    type Guild,
    type GuildMember,
} from 'discord.js';
import { Command } from '../../typings/index.js';
import { archiveMessages, sendBotLog } from '../../helpers.js';
import { BotLogOptions } from '../../typings/index.js';
import chalk from 'chalk';

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
                .addStringOption(option => option
                    .setName('reason')
                    .setDescription('Reason for sending user to a moderated channel.')
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
        if (!interaction.channel?.isTextBased || !interaction.inCachedGuild()) return;

        const subCommand = interaction.options.getSubcommand();

        const userOption = interaction.options.get('user', true);
        if (!userOption) return interaction.reply({ content: `I have not recieved a user to moderate!`, ephemeral: true });

        // This should never run but we will do this anyway, command is blocked from dms
        if (!interaction.guild) return interaction.reply({ content: `This command must be ran in a guild!`, ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        switch(subCommand) {
            case 'send':
                sendToModerated(interaction.guild, userOption, interaction);
                break;
            case 'release':
                releaseFromModerated(interaction.guild, userOption, interaction);
                break;
        }

        return;
    }
}

async function sendToModerated(guild: Guild, userOption: CommandInteractionOption, interaction: ChatInputCommandInteraction) {
    const { user, member } = userOption
    if (!user || !member ) return;
    
    const categoryConfig = interaction.client.getConfig('moderatedCategory', guild.id)
    const category = guild.channels.cache.find((channel) => {
        return channel.name === categoryConfig;
    })
    if (!category) {
        console.log(chalk.red(`Missing required moderated category under the name of ${categoryConfig} in ${guild.id}`));
        return interaction.editReply(`Missing required moderated category under the name of ${categoryConfig}!`)
    }

    const channel = await guild.channels.create({
        name: `moderated-${user.displayName}`,
        parent: category.id,
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

    // If isolation is true then give the moderated role
    if (interaction.options.get('isolate')?.value) {
        const role = guild.roles.cache.find((role) => {
            return (role.name === guild.client.getConfig('moderatedIsolationRole'))
        });
        if (!role) {
            console.log(`${guild.name} is missing role by the name of (${guild.client.getConfig('moderatedIsolationRole')}), skipping isolation`);
        } else {
            (member as GuildMember).roles
                .add(role.id)
                .catch(console.error);
        }
    }

    const reason = interaction.options.get('reason', true).value;
    sendBotLog(guild, {
        title: 'User sent to moderated channel',
        embed: new EmbedBuilder()
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .addFields(
                {
                    name: '📖Channel',
                    value: `<#${channel.id}> \n (**${channel.name}**)`,
                },
                {
                    name: '🙍User',
                    value: `<@${user.id}>`,
                    inline: true
                },
                {
                    name: '🛡️Staff Member',
                    value: `<@${interaction.user.id}>`,
                    inline: true
                },
                {
                    name: '🗒️Reason',
                    value: ((reason as string) || 'No reason provided')
                }
            )
    });

    return interaction.editReply(`<@${user.id}> has successfully been moderated!`)
        .catch(console.error);
}

async function releaseFromModerated(guild: Guild, userOption: CommandInteractionOption, interaction: ChatInputCommandInteraction) {
    const channelId = await interaction.client.db
        .selectFrom('mod_channels')
        .select('channel_id')
        .executeTakeFirst()
        .then((channel) => {
            if (!channel) return null;
            return channel.channel_id
        })
        .catch(console.error);
    if (!channelId) return;

    const channel = await guild.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return;

    const { member, user } = userOption;
    if (!user || !member ) return;
    
    const role = guild.roles.cache.find((role) => {
        return (role.name === guild.client.getConfig('moderatedIsolationRole'));
    });
    if (role) {
        (member as GuildMember).roles
            .remove(role.id)
            .catch(console.error);
    }

    const messageAttachment = await archiveMessages(channel, { attachment: { name: channel.name }})
        .catch(console.error);

    const embed = new EmbedBuilder()
        .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
        .addFields(
            {
                name: '📖Channel',
                value: `**${channel.name}**`,
            },
            {
                name: '🙍User',
                value: `<@${user.id}>`,
                inline: true
            },
            {
                name: '🛡️Released By',
                value: `<@${interaction.user.id}>`,
                inline: true
            }
        )

    const botLogOptions: BotLogOptions['data'] = {
        title: 'User released from moderated channel',
        embed: embed
    }
    if (messageAttachment) botLogOptions.attachments = [messageAttachment];

    sendBotLog(guild, botLogOptions);

    await channel
        .delete()
        .catch(console.error);

    // Since command can be done out of deleted channel lets edit the reply! Ignore errors since deleting the message channel will do so
    return await interaction.editReply(`<@${user.id}> has successfully been released!`)
        .catch(() => {});
}

export default uhOhCommand;