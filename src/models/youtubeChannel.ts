import { Model, DataTypes } from '@sequelize/core';
import { Attribute } from '@sequelize/core/decorators-legacy';

class YoutubeChannel extends Model {
    @Attribute(DataTypes.STRING)
    declare channelId: string;

    @Attribute(DataTypes.STRING)
    declare latestVideo: string

    @Attribute(DataTypes.STRING)
    declare guildId: string

    @Attribute(DataTypes.STRING)
    declare addedBy: string
}

export default YoutubeChannel