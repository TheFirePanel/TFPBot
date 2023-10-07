// Generated using npx kysely-codegen
// Must have DATABASE_URL setup

import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Configs {
  guild_id: string;
  option: string;
  value: Generated<string | null>;
}

export interface ModChannels {
  channel_id: string;
  guild_id: string;
  user_id: Generated<string | null>;
  added_by: Generated<string | null>;
}

export interface YoutubeChannels {
  channel_id: string;
  guild_id: string;
  latest_video: Generated<string | null>;
  added_by: Generated<string | null>;
}

export interface DB {
  configs: Configs;
  mod_channels: ModChannels;
  youtube_channels: YoutubeChannels;
}
