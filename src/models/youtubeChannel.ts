import { Model } from 'objection';

export default class YoutubeChannel extends Model {
    channelId: string
    latestVideo: string
    guildId: string
    addedBy: string

    static get tableName() { 
        return 'youtubeChannels';
    }

    static get idColumn() {
        return 'channelId';
      }
};