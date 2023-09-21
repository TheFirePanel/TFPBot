import { Client, Events } from 'discord.js';
import { Utility } from '../../typings/index.js';
import axios from 'axios';

const githubRepo = 'https://raw.githubusercontent.com/TheFirePanel/SimplexModelChecker/main'

const simplexModelChecker: Utility = {
    name: 'simplexModelChecker',
    event: Events.ClientReady,
    cache: {
        categories: [],
        autoDevices: [],
        devices: [],
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
