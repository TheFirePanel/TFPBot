import {
    EmbedBuilder,
    Events,
    type GuildMember
} from 'discord.js'
import type { Utility } from '../../typings/index.js';

/**
 * @name joinLeaveLog
 * @event GuildMemberAdd
 * @event GuildMemberRemove
 * @author DrPepperG
 * @desc This utility runs on guild member add and remove, sends a message in a configured channel.
 */
const messageDeletionLog: Utility = {
    name: 'joinLeaveLog',
    events: [Events.GuildMemberAdd, Events.GuildMemberRemove],
    async execute(member: GuildMember, eventName) {
        if (!member) return;
        const { guild } = member;

        const channelName = guild.client.getConfig('joinLeaveChannel', guild.id);
        const logChannel = member.guild.channels.cache.find((channel) => {
            return (channel.name === channelName);
        });
        if (!logChannel || !logChannel.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
            .setTimestamp();

        switch(eventName) {
            case Events.GuildMemberAdd:
                embed
                    .setTitle(`Welcome to ${member.guild.name}!`)
                    .setDescription(`<@${member.id}> has joined the server! Welcome! 😄`)
                    .setColor('Green');
                break;
            case Events.GuildMemberRemove:
                embed
                    .setTitle(`Departure from ${member.guild.name}!`)
                    .setDescription(`${member.displayName} has left the server. 😞`)
                    .setColor('Red');
                break;
        }

        logChannel.send({
            content: `<@${member.id}>`,
            embeds: [embed]
        }).catch(console.error);
    }
}

export default messageDeletionLog;
