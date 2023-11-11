import {
    Events,
    type DMChannel,
    type GuildChannel
} from 'discord.js'
import { type Utility } from '../../typings/index.js';

/**
 * @name uhOhChannelDelete
 * @event ChannelDelete
 * @author DrPepperG
 * @desc This utility runs on channel delete, and checks if the deleted channel was in the moderated channel database.
 */
const uhOhChannelDelete: Utility = {
    name: 'uhOhChannelDelete',
    events: Events.ChannelDelete,
    async execute(channel: DMChannel | GuildChannel) {
        if (!channel.isTextBased() || channel.isDMBased()) return;

        await channel.client.db
            .selectFrom('mod_channels')
            .select('user_id')
            .where('channel_id', '=', channel.id)
            .executeTakeFirst()
            .catch(console.error)
            .then(async (moderated) => {
                if (!moderated || !moderated.user_id) return;

                const member = await channel.guild.members.fetch(moderated.user_id);
                const guild = channel.guild;

                const role = guild.roles.cache.find((role) => {
                    return (role.name === guild.client.getConfig('moderatedIsolationRole', guild.id))
                });
                if (!role) return console.log(`${guild.name} is missing role by the name of (${guild.client.getConfig('moderatedIsolationRole', guild.id)}), skipping isolation`);

                member?.roles
                    .remove(role.id)
                    .catch(console.error);
            });

        await channel.client.db
            .deleteFrom('mod_channels')
            .where('channel_id', '=', channel.id)
            .executeTakeFirst()
            .catch(console.error)
            .then((res) => {
                if (!res || res.numDeletedRows <= 0) return;
                console.log(`Removed channel (${channel.id}) from the moderated channels database as it was deleted.`)
            });
    }
}

export default uhOhChannelDelete;
