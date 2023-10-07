import { Client, Events, TextChannel } from 'discord.js';
import { XMLParser } from 'fast-xml-parser';
import { Utility } from '../../typings/index.js';
import axios from 'axios';

type LatestVideo = {
    id: string,
    author: {
        name: string,
        uri: string
    },
    title: string,
    link: string
}

/**
 * @name youtubeWatcher
 * @event ClientReady
 * @author DrPepperG
 * @desc This utility runs on bot ready and provides the logic behind the #new-videos channel.
 * Every 30 minutes each channel will be checked for new videos compared to last video stored,
 * if new video is found then a link will be sent in #new-videos.
 */
const youtubeWatcher: Utility = {
    name: 'youtubeWatcher',
    event: Events.ClientReady,
    cache: {
        refresh: true,
        announcementChannels: [],
        channels: [],
    },
    async execute(client: Client) {
        runWatcher(client);
        setInterval(async () => {
            runWatcher(client)
        }, 30 * 60 * 1000);
    }
}

async function runWatcher(client: Client) {
    const cache = client.util.get('youtubeWatcher')?.cache
    if (!cache) return

    if (cache.refresh) {
        const channels = await client.db
            .selectFrom('youtube_channels')
            .selectAll()
            .execute();

        cache.channels = channels;
        cache.refresh = false;
    }

    cache.channels.forEach((channel: any, index: number) => {
        setTimeout(async () => {
            const latestVideo = await getLatestVideo(channel.channel_id)
                .catch((err) => {
                    console.error(err, channel);
                });

            if (!latestVideo) {
                return;
            }

            if (latestVideo.id !== channel.latest_video) {
                console.log(`${latestVideo.author.name} has a new video, updating stored values and sending to announcement channel!`);

                cache!.channels[index].latest_video = latestVideo.id;
                await client.db
                    .updateTable('youtube_channels')
                    .set({
                        latest_video: latestVideo.id
                    })
                    .where("channel_id", "=", channel.channel_id)
                    .execute();

                announceVideo(client, channel.guild_id, latestVideo)
            }
        }, index * 5000)
    });
}

async function getLatestVideo(channelId: string): Promise<LatestVideo | null> {
    return axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
        .then((res) => {
            // When node doesn't have DOM -_-
            const parser: any = new XMLParser({
                attributeNamePrefix: '',
                ignoreAttributes: false 
            });
            const parsedData = parser.parse(res.data).feed;

            if (!parsedData.entry) {
                return null;
            }

            let latestVideo;
            // Check if we can sort through the videos, before this would error out if user had only one video.
            if (parsedData.entry.length) {
                // Sort through videos to make sure we get the right latest video
                latestVideo = parsedData.entry.sort((a: any, b: any) => {
                    let aPubDate = new Date(a.pubDate || 0).getTime();
                    let bPubDate = new Date(b.pubDate || 0).getTime();
                    return bPubDate - aPubDate;
                })[0];
            } else {
                latestVideo = parsedData.entry;
            }


            return {
                id: latestVideo.id,
                author: latestVideo.author,
                title: latestVideo.title,
                link: latestVideo.link.href
            };
        });
}

async function announceVideo(client: Client, guildId: string, latestVideo: LatestVideo) {
    await client.guilds.fetch(guildId)
        .then(async (guild) => {
            return guild.channels.cache.find((channel) => {
                return channel.name === client.getConfig('youtubeWatcherChannel', guild.id);
            })
        })
        .then((channel) => {
            (channel as TextChannel)
                .send(latestVideo.link)
                .catch((err) => { console.error(err) })
        })
        .catch(() => {})
}

export default youtubeWatcher;