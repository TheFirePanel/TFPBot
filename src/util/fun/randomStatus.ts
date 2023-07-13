import { ActivityOptions, ActivityType, Client, Events } from 'discord.js';
import { Utility } from '../../types.d.js';

const statusMessages: ActivityOptions[] = [
    {
        name: 'over the peasants',
        type: ActivityType.Watching
    },
    {
        name: 'with your feelings',
        type: ActivityType.Playing
    }
];

const randomStatus: Utility = {
    name: 'randomStatus',
    event: Events.ClientReady,
    execute(client: Client) {
        const initialStatus = statusMessages[Math.floor(statusMessages.length * Math.random())];
        if (!initialStatus) return console.warn('Missing statusMessages, not running utility.', this.name);

        // Change status every 3 minutes
        setInterval(() => {
            // Remember to grab a new status from the array, if we use the var above it'll always be the same.
            const status = statusMessages[Math.floor(statusMessages.length * Math.random())]
            client.user?.setActivity(status)
        }, (3 * 60 * 1000));

        console.log(`Initialized function selected "${initialStatus.name}" as initial status.`, this.name)
        return client.user?.setActivity(initialStatus);
    }
}

export default randomStatus;
