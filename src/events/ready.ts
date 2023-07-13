import { Events, type Client } from 'discord.js'
import color from 'chalk';

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        if (!client) return;
        console.log(color.bold.magenta(`Ready! Logged in as ${color.bgCyan(client.user!.tag)}`));
    },
};
