import { Events, type DMChannel, type GuildChannel } from 'discord.js'
import { Utility } from '../../typings/index.js';

/**
 * @name uhOhChannelDelete
 * @event ChannelDelete
 * @author DrPepperG
 * @desc This utility runs on channel delete, and checks if the deleted channel was in the moderated channel database.
 */
const uhOhChannelDelete: Utility = {
    name: 'uhOhChannelDelete',
    event: Events.ChannelDelete,
    async execute(channel: DMChannel | GuildChannel) {
        if (!channel.isTextBased()) return;

        const client = channel.client
        await client.db
            .deleteFrom('mod_channels')
            .where('channel_id', '=', channel.id)
            .executeTakeFirst()
            .then((res) => {
                if (res.numDeletedRows <= 0) return;
                console.log(`Removed channel (${channel.id}) from the moderated channels database as it was manually deleted.`)
            });
    }
}

export default uhOhChannelDelete;
