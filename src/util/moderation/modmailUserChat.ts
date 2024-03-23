import {
    codeBlock,
    EmbedBuilder,
    Events,
    MessageType,
    type PartialMessage,
    type Message,
} from 'discord.js';
import type { Utility } from '../../typings/index.js';
import { extractMailId } from '../../commands/moderation/modmail.js';

/**
 * @name modmailUserChat
 * @event MessageCreate
 * @author DrPepperG
 * @desc This utility runs on message create, any response in dms will send message to mod chat.
 */
const modmailModChat: Utility = {
    name: 'modmailUserChat',
    events: Events.MessageCreate,
    async execute(message: PartialMessage | Message) {
        if (!message) return;
        if (!message.channel.isDMBased() || message.type !== MessageType.Reply) return;

        const { client, channel, author } = message;
        // Make sure it's just a reply to our user
        if (message.mentions.repliedUser?.id !== client.user.id) return;
        if (!message.reference?.messageId) return;

        // Extract the mailId from the embed
        const mailId = await channel.messages.fetch(message.reference?.messageId)
            .then((message) => {
                if (message.author.id !== client.user.id) return; // We already check above but check again for safe measure
                if (!message.embeds || !message.embeds[0]) return; // Make sure this has an embed
                const embed = message.embeds[0];

                return extractMailId(embed);
            });
        if (!mailId) return;

        const modMail = await client.db
            .selectFrom('modmail')
            .selectAll()
            .where('id', '=', mailId)
            .where('dm_channel_id', '=', channel.id)
            .executeTakeFirst()
            .then((res) => {
                return res;
            })
            .catch(() => {});
        if (!modMail || !modMail.user_id) return; // Make error

        // Get stored guild information
        const guild = await client.guilds.fetch(modMail.guild_id)
            .then((guild) => {
                return guild;
            });
        if (!guild) return;

        // Get configured mod channel
        const channelName = guild.client.getConfig('modChatChannel', guild.id);
        const modChannel = guild.channels.cache.find((channel) => {
            return (channel.name === channelName);
        });
        if (!modChannel || !modChannel.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTimestamp()
            .setFooter({
                text: `Mail ID ${mailId} • Version ${process.env.version}`
            })
            .setTitle(`📫 ${guild.name} Modmail Response`)
            .toJSON();

        // Send message to mod-chat
        return await modChannel.send({
            embeds: [
                new EmbedBuilder(embed)
                    .setAuthor({ name: author.displayName, iconURL: author.displayAvatarURL() })
                    .addFields(
                        {
                            name: '🙍 User',
                            value: `<@${author.id}>`,
                            inline: true
                        },
                        {
                            name: '🕔 Originally Created (UTC)',
                            value: `<t:${modMail.created_at.getTime() / 1000}>`,
                            inline: true
                        },
                        {
                            name: '📜 Original Message',
                            value: codeBlock(modMail.message || 'No message provided???')
                        },
                        {
                            name: '🗒️ Response Message',
                            value: codeBlock((message.content || 'No message provided???'))
                        }
                    )
            ]
        }).then(() => {
            message.react('📨');
        })
        .catch(() => {
            message.react('❌');
        });
    }
};

export default modmailModChat;
