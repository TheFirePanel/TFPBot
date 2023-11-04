import { Events, type Client } from 'discord.js';
import { type Utility } from '../../typings/index.js';
import axios from 'axios';

const githubRepo = 'https://raw.githubusercontent.com/TheFirePanel/SimplexModelChecker/main'

/**
 * @name simplexModelChecker
 * @event ClientReady
 * @author DrPepperG
 * @desc This utility runs on bot ready and provides the data from the simplex model github page.
 */
const simplexModelChecker: Utility = {
    name: 'simplexModelChecker',
    events: Events.ClientReady,
    cache: {
        categories: [],
        autoDevices: [],
        devices: {},
    },
    async execute(client: Client) {
        const categories: string[]  = await axios.get(`${githubRepo}/categories.json`)
            .then((res) => {
                return res.data.categories;
            })

        if (!categories) {
            return console.log('No categories for SimplexModelChecker found, returning.')
        }

        const cache = client.util.get(this.name)?.cache;
        if (!cache) return;

        categories.forEach(async (category) => {
            const devices: string[] = await axios.get(`${githubRepo}/${category}.json`)
                .then((res) => {
                    return res.data.devices
                })

            cache.devices[category] = devices;
            cache.autoDevices.push(...devices);
        });
    }
}

export default simplexModelChecker;
