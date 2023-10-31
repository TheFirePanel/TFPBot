import {
    AuditLogEvent,
    // codeBlock,
    EmbedBuilder,
    Events,
    type PartialMessage,
    type Message,
    type GuildAuditLogsEntry,
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
    event: Events.MessageDelete,
    async execute(message: PartialMessage | Message) {
        if (!message || !message.guild) return;
        if (message.channel.isDMBased()) return;

        let auditLog: GuildAuditLogsEntry | undefined;
        if (message.guild.members.me?.permissions.has('ViewAuditLog')) {
            auditLog = await message.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MessageDelete
            }).then((log) => {
                const entry = log.entries.first();
                if (!entry) return undefined;
                // Check if audit log is for channel the message was in
                if (entry.extra.channel.id !== message.channel.id) return undefined;
                console.log(entry.createdTimestamp, Date.now())

                return entry;
            })
        }

        console.log(auditLog?.id);

        sendBotLog(message.guild, {
            title: 'Message Deleted',
            color: 'Red',
            embed: new EmbedBuilder()
                .addFields(
                    {
                        name: '📖 Channel',
                        value: `<#${message.channel.id}>`
                    },
                )
        })
    }
}

export default messageDeletionLog;
