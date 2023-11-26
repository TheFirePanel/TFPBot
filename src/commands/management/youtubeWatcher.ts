import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../typings/index.js';

const youtubeWatcherCommand: Command = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a channel to the watchlist.')
                .addStringOption(option => 
                    option
                        .setName('channel_id')
                        .setDescription('Channel to watch, you can get it from about page share button')
                        .setRequired(true)
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a channel to the watchlist.')
                .addStringOption(option => 
                    option
                        .setName('channel_id')
                        .setDescription('Channel to remove from the watch, you can get it from about page share button')
                        .setRequired(true)
                    )
                )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .setName('youtubewatcher')
        .setDescription('Configuration for the youtubeWatcher!'),
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const client = interaction.client;

        // Since both actions use these parameters we can use this before the switch statement
        const channelId = interaction.options.getString('channel_id');

        if (!channelId || !interaction.guild) {
            return interaction.reply({
                content: 'You are missing the required items to run this command!',
                ephemeral: true
            });
        }

        // I doubt Youtube would change this in the near future, famous last words though
        if (!channelId.startsWith('UC')) {
            return interaction.reply({
                content: 'All YoutubeChannel ids start with UC, please ensure you copied the correct string!',
                ephemeral: true
            });
        }

        switch(subCommand) {
            case 'add':
                await client.db
                    .insertInto('youtube_channels')
                    .values({
                        channel_id: channelId,
                        guild_id: interaction.guild.id,
                        added_by: interaction.user.id
                    })
                    .execute()
                    .catch(console.error);

                interaction.reply({
                    content: `Added ${channelId} to the watchlist, changes should take effect next cycle!`,
                    ephemeral: true
                });

                break;
            case 'remove':
                await client.db
                    .deleteFrom('youtube_channels')
                    .where('channel_id', '=', channelId)
                    .execute()                    
                    .catch(console.error);

                interaction.reply({
                    content: `Removed ${channelId} from the watchlist, changes should take effect next cycle!`,
                    ephemeral: true
                });

                break;
        }

        // Tell the utility to grab from the database next run
        const cache = client.util.get('youtubeWatcher')?.cache;

        if (cache) {
            cache.refresh = true;
        }

        return true
    }
}

export default youtubeWatcherCommand;
