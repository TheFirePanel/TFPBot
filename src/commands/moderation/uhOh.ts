import {
    codeBlock,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    RESTJSONErrorCodes,
    type ChatInputCommandInteraction,
    type CommandInteractionOption,
    type Guild,
    type GuildBasedChannel,
    type GuildMember,
} from 'discord.js';
import { Command } from '../../typings/index.js';
import { archiveMessages, sendBotLog } from '../../helpers.js';
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
    async execute(interaction) {
        if (!interaction.channel || !interaction.channel.isTextBased() || !interaction.inCachedGuild()) return;

        const subCommand = interaction.options.getSubcommand();

        const userOption = interaction.options.get('user', true);
        if (!userOption || !userOption.user) return interaction.reply({ content: `I have not recieved a valid user to moderate!`, ephemeral: true })
            .catch(console.error);

        // This should never run but we will do this anyway, command is blocked from dms
        if (!interaction.guild) return interaction.reply({ content: `This command must be ran in a guild!`, ephemeral: true })
            .catch(console.error);

        await interaction.deferReply({ ephemeral: true })
            .catch(console.error);

        switch(subCommand) {
            case 'send':
                await sendToModerated(interaction.guild, userOption, interaction);
                break;
            case 'release':
                await releaseFromModerated(interaction.guild, userOption, interaction);
                break;
        }

        // Since we delete a channel sometimes, check if the channel exists too
        if (!interaction.replied && interaction.channel) {
            interaction.editReply(`Function has completed but no reply was given, please contact a bot administrator.`)
                .catch(console.error);
        }
        
        return;
    }
};

export async function sendToModerated(guild: Guild, userOption: CommandInteractionOption, interaction: ChatInputCommandInteraction) {
    const { user, member } = userOption;
    if (!user || !member ) return;
    
    // Check if user is already moderated
    const alreadyModerated = await interaction.client.db
        .selectFrom('mod_channels')
        .where('user_id', '=', user.id)
        .select(({ fn }) => [
            fn.count<number>('channel_id').as('channel_count')
        ])
        .executeTakeFirst()
        .then((count) => {
            return (count && count.channel_count > 0);
        });

    if (alreadyModerated) {
        return interaction.editReply(`<@${user.id}> is already moderated, run release command if this is not the desired result.`)
            .catch(console.error);
    }
    
    // Get category information
    const categoryConfig = interaction.client.getConfig('moderatedCategory', guild.id);
    const category = guild.channels.cache.find((channel) => {
        return channel.name === categoryConfig;
    });
    if (!category) {
        console.log(chalk.red(`Missing required moderated category under the name of ${categoryConfig} in ${guild.id}`));
        return interaction.editReply(`Missing required moderated category under the name of ${categoryConfig}!`)
            .catch(console.error);
    }

    // Create channel
    const channel = await guild.channels.create({
        name: `moderated-${user.displayName}`,
        parent: category.id,
        reason: `Sent to moderated channel by ${interaction.user.displayName}`
    }).then(async (channel) => {
        await channel.lockPermissions()
            .catch(console.error);

        await channel.permissionOverwrites.create(user, {
            SendMessages: true,
            ViewChannel: true,
            ReadMessageHistory: true
        });

        return channel;
    }).catch(console.error);
    if (!channel) return;

    // Insert channel into database
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
            return (role.name === guild.client.getConfig('moderatedIsolationRole', guild.id));
        });
        if (!role) {
            console.log(`${guild.name} is missing role by the name of (${guild.client.getConfig('moderatedIsolationRole', guild.id)}), skipping isolation`);
        } else {
            (member as GuildMember).roles
                .add(role.id)
                .catch(console.error);
        }
    }

    // Send bot log
    const reason = interaction.options.get('reason', true).value;
    sendBotLog(guild, {
        title: 'User sent to moderated channel',
        embed: new EmbedBuilder()
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .addFields(
                {
                    name: '📖 Channel',
                    value: `<#${channel.id}> \n ${codeBlock(channel.name)}`,
                },
                {
                    name: '🙍 User',
                    value: `<@${user.id}>`,
                    inline: true
                },
                {
                    name: '🛡️ Staff Member',
                    value: `<@${interaction.user.id}>`,
                    inline: true
                },
                {
                    name: '🗒️ Reason',
                    value: codeBlock(((reason as string) || 'No reason provided'))
                }
            )
    });

    // End function
    return interaction.editReply(`<@${user.id}> has successfully been moderated!`)
        .catch(console.error);
}

export async function releaseFromModerated(guild: Guild, userOption: CommandInteractionOption, interaction: ChatInputCommandInteraction) {
    const { member, user } = userOption;
    if (!user) return;

    // Get channel from database
    const channel = await interaction.client.db
        .selectFrom('mod_channels')
        .select('channel_id')
        .where('user_id', '=', user.id)
        .execute()
        .then(async (channelIds) => {
            if (!channelIds) return null;

            // If channel wasn't deleted and we somehow didn't catch it, delete. Return first active channel.
            const channels: GuildBasedChannel[] = [];
            for (const channelId of channelIds) {
                const channel = await guild.channels.fetch(channelId.channel_id)
                    .catch((error) => {
                        if (error.code === RESTJSONErrorCodes.UnknownChannel) {
                            interaction.client.db
                                .deleteFrom('mod_channels')
                                .where('channel_id', '=', channelId.channel_id)
                                .execute();
                        }
                    });
                
                if (!channel) continue;
                channels.push(channel);
            }

            return channels[0];
        })
        .catch(console.error);

    if (!channel) return interaction.editReply(`<@${user.id}> does not exist in the database.`)
        .catch(console.error);
    if (!channel.isTextBased()) return;
    
    // If user is still in the guild then remove their role
    if (member) {
        const role = guild.roles.cache.find((role) => {
            return (role.name === guild.client.getConfig('moderatedIsolationRole', guild.id));
        });
        if (role) {
            (member as GuildMember).roles
                .remove(role.id)
                .catch(console.error);
        }
    }

    // Archive the channel's content
    const messageAttachment = await archiveMessages(channel, { attachment: { name: `${user.displayName}[${Date.now()}]` }})
        .catch(console.error);

    // Build bot log
    const embed = new EmbedBuilder()
        .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
        .addFields(
            {
                name: '📖Channel',
                value: codeBlock(channel.name)
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
        );
        

    const botLogOptions: Parameters<typeof sendBotLog>[1] = {
        title: 'User released from moderated channel',
        embed: embed,
    };
    if (messageAttachment) botLogOptions.attachments = [messageAttachment];

    sendBotLog(guild, botLogOptions);

    // Delete channel
    await channel
        .delete()
        .catch(console.error);

    // Only send a reply if the channel still exists
    if (interaction.channel) {
        await interaction.editReply(`<@${user.id}> has successfully been released!`)
            .catch(console.error);
    }

    // End function
    return;
}

export default uhOhCommand;