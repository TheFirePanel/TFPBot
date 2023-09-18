import { Client, Events, TextChannel } from 'discord.js';
import { XMLParser } from 'fast-xml-parser';
import { Utility } from '../../types.d.js';
import axios from 'axios';

const youtubeWatcher: Utility = {
    name: 'youtubeWatcher',
    event: Events.ClientReady,
    cache: {
        refresh: true,
        data: []
    },
    async execute(client: Client) {
        const announcementChannel = await client.guilds.fetch('908908014965252116')
            .then(async (guild) => {
                return await guild.channels.fetch('1128041309307949077')
            });

        setInterval(async () => {
            if (this.cache?.refresh) {
                const channels = await client.db
                    .selectFrom('youtube_channels')
                    .selectAll()
                    .execute();

                this.cache.data = channels;
                this.cache.refresh = false;
            }

            

            this.cache?.data.forEach(async (channel, key) => {
                const latestVideo = await getLatestVideo(channel.channel_id);

                if (latestVideo.id !== channel.latest_video) {
                    console.log(`${latestVideo.author.name} has a new video, updating stored values and sending to announcement channel!`, this.name);

                    this.cache!.data[key].latest_video = latestVideo.id;
                    await client.db
                        .updateTable('youtube_channels')
                        .set({
                            latest_video: latestVideo.id
                        })
                        .execute();

                    if (announcementChannel?.isTextBased()) {
                        (announcementChannel as TextChannel).send(latestVideo.link)
                    }
                }
            });

        }, 10000);
    }
}

async function getLatestVideo(channelId: string): Promise<{
    id: string,
    author: {
        name: string,
        uri: string
    },
    title: string,
    link: string
}> {
    return axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
        .then((res) => {
            // When node doesn't have DOM -_-
            const parser = new XMLParser({
                attributeNamePrefix: '',
                ignoreAttributes: false 
            });
            const parsedData = parser.parse(res.data).feed;
            // Sort through videos to make sure we get the right latest video
            const latestVideo = parsedData.entry.sort((a: any, b: any) => {
                let aPubDate = new Date(a.pubDate || 0).getTime();
                let bPubDate = new Date(b.pubDate || 0).getTime();
                return bPubDate - aPubDate;
            })[0];

            return {
                id: latestVideo.id,
                author: latestVideo.author,
                title: latestVideo.title,
                link: latestVideo.link.href
            };
        });
}

export default youtubeWatcher;