import {
    codeBlock,
    EmbedBuilder,
    Events,
    type PartialMessage,
    type Message,
} from 'discord.js'
import type { Utility } from '../../typings/index.js';
import { sendBotLog } from '../../helpers.js';

/**
 * @name messageDeletionLog
 * @event MessageDelete
 * @author DrPepperG
 * @desc This utility runs on message delete, logs deleted message to configured bot logs
 */
const messageDeletionLog: Utility = {
    name: 'messageDeletionLog',
    events: Events.MessageDelete,
    async execute(message: PartialMessage | Message) {
        if (!message || !message.guild) return;
        if (message.channel.isDMBased()) return;
        if (!message.partial && (message.author?.id === message.client.user.id)) return;

        const embed = new EmbedBuilder();
        embed.addFields(
                {
                    name: '📖 Channel ID',
                    value: `${codeBlock(message.channel.id)} <#${message.channel.id}>`,
                    inline: true
                },
                {
                    name: '💵 Message ID',
                    value: codeBlock(message.id),
                    inline: true
                }
            )

        if (!message.partial) {
            embed.addFields(
                {
                    name: '🙍 User ID',
                    value: `${codeBlock(message.author.id)} <@${message.author.id}>`
                },
                {
                    name: '🗒️ Content',
                    value: codeBlock(message.content ? message.content : 'No message content.')
                }
            )
            .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
        }

        sendBotLog(message.guild, {
            title: 'Message Deleted',
            color: 'Red',
            embed: embed
        })
    }
}

export default messageDeletionLog;
