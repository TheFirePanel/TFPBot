import { Events, type Client } from 'discord.js'
import color from 'chalk';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        if (!client) return;
        console.log(color.bold.magenta(`Ready! Logged in as ${color.bgCyan(client.user!.tag)}`));
    },
};
