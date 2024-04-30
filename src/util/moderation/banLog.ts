import {
    AuditLogEvent,
    codeBlock,
    EmbedBuilder,
    Events,
    type GuildBan
} from 'discord.js';
import { sendBotLog } from '../../helpers.js';
import type { Utility } from '../../typings/index.js';

/**
 * @name banLog
 * @event GuildBanAdd
 * @event GuildBanRemove
 * @author DrPepperG
 * @desc This utility runs on guild ban add and remove, sends a message in a configured channel.
 */
const banLog: Utility = {
    name: 'banLog',
    events: [Events.GuildBanAdd, Events.GuildBanRemove],
    async execute(ban: GuildBan, eventName) {
        if (!ban) return;

        const { user, guild } = ban;

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .setTimestamp();

        switch(eventName) {
            case Events.GuildBanAdd:
                // eslint-disable-next-line no-case-declarations
                const banReason = await guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberBanAdd,
                    limit: 1
                }).then((logs) => {
                    return logs.entries.first()?.reason;
                });

                embed
                    .setColor('Red')
                    .addFields(
                        {
                            name: '🙍 User ID',
                            value: `${codeBlock(user.id)} <@${user.id}>`
                        },
                        {
                            name: '🗒️ Reason',
                            value: codeBlock(banReason ? banReason : 'No reason provided.')
                        }
                    );
                break;
            case Events.GuildBanRemove:
                embed
                    .setColor('Green')
                    .addFields(
                        {
                            name: '🙍 User ID',
                            value: `${codeBlock(user.id)} <@${user.id}>`
                        }
                    );
                break;
        }

        const isBan = (eventName === Events.GuildBanAdd);
        sendBotLog(guild, {
            title: (isBan) ? 'User banned' : 'User unbanned',
            color: (isBan) ? 'Red' : 'Green',
            embed: embed
        });
    }
};

export default banLog;
