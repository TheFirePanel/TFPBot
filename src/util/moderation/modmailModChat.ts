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
 * @name modmailModChat
 * @event MessageCreate
 * @author DrPepperG
 * @desc This utility runs on message create, any response in mod chat will send mail to the respective user stored in the database.
 */
const modmailModChat: Utility = {
    name: 'modmailModChat',
    events: Events.MessageCreate,
    async execute(message: PartialMessage | Message) {
        if (!message || !message.guild) return;
        if (message.channel.isDMBased() || message.type !== MessageType.Reply) return;

        const { client, guild, channel } = message;
        if (client.getConfig('modChatChannel', guild.id) !== channel.name) return; // Only check mod chat

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
            .where('guild_id', '=', guild.id)
            .executeTakeFirst()
            .then((res) => {
                return res;
            })
            .catch(() => {});
        if (!modMail || !modMail.user_id) return; // Make error

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTimestamp()
            .setFooter({
                text: `Mail ID ${mailId} • Version ${process.env.version}`
            })
            .setTitle(`📫 ${guild.name} Modmail Response`)
            .toJSON();

        return await guild.members.fetch(modMail.user_id)
            .then((member) => {
                member.send({
                    embeds: [
                        new EmbedBuilder(embed)
                            .setDescription(`Response from **${guild.name}** moderation team, reply to this embed to send any additional responses.`)
                            .addFields(
                                {
                                    name: '🗒️ Message',
                                    value: codeBlock(message.content || 'No message provided???')
                                }
                            )
                    ]
                })
                .then(() => {
                    message.react('📨');
                })
                .catch(() => {
                    message.react('❌');
                });
            });
    }
};

export default modmailModChat;
