import { Events, type Client } from 'discord.js'
import color from 'chalk';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        if (!client) return;
        console.log(color.bold.magenta(`Ready! Logged in as ${color.bgCyan(client.user!.tag)}`));

        client.guilds.fetch('908908014965252116')
            .then(async (guild) => {
                const member = await guild.members.fetch('161174744585076736');

                client.emit(Events.GuildMemberRemove, member);
            }) 
    },
};
