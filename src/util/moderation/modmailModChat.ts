import {
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
 * @desc This utility runs on message create, 
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

        await guild.members.fetch(modMail.user_id)
            .then((member) => {
                member.send(message.content);
            });

        message.react('📨');
    }
};

export default modmailModChat;
