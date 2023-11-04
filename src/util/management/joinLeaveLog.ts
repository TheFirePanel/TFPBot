import {
    Events,
    type GuildMember
} from 'discord.js'
import type { Utility } from '../../typings/index.js';

/**
 * @name messageDeletionLog
 * @event MessageDelete
 * @author DrPepperG
 * @desc This utility runs on message delete, logs deleted message to configured bot logs
 */
const messageDeletionLog: Utility = {
    name: 'joinLeaveLog',
    events: [Events.GuildMemberAdd, Events.GuildMemberRemove],
    async execute(member: GuildMember, eventName) {
        if (!member) return;

        const { guild } = member;

        const logChannel = member.guild.channels.cache.find((channel) => {
            return (channel.name === guild.client.getConfig('joinLeaveChannel', guild.id) );
        });
        if (!logChannel || !logChannel.isTextBased()) return;

        switch(eventName) {
            case Events.GuildMemberAdd:
                // logChannel.send('yeet join');
                break;
            case Events.GuildMemberRemove:
                // logChannel.send('nooo leave');
                break;
        }
    }
}

export default messageDeletionLog;
