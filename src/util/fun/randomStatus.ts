import { ActivityType, Events, type ActivityOptions, type Client } from 'discord.js';
import { type Utility } from '../../typings/index.js';

const statusMessages: ActivityOptions[] = [
    {
        name: '🔥 Slow dancing in a burning room',
        type: ActivityType.Custom
    },
    {
        name: '📼 New videos coming in May',
        type: ActivityType.Custom
    },
    {
        name: '🍑 Jake you pompous ass',
        type: ActivityType.Custom
    }
];

/**
 * @name randomStatus
 * @event ClientReady
 * @author DrPepperG
 * @desc This utility runs on bot ready and sets a random status from the above array every 3 minutes.
 */
const randomStatus: Utility = {
    name: 'randomStatus',
    events: Events.ClientReady,
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
