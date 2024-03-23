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
  added_by: Generated<string | null>;
  channel_id: string;
  guild_id: string;
  user_id: Generated<string | null>;
}

export interface Modmail {
  created_at: Generated<Date>;
  guild_id: string;
  id: unknown;
  message: Generated<string | null>;
  mod_message_id: string;
  user_id: Generated<string | null>;
  user_message_id: Generated<string | null>;
}

export interface YoutubeChannels {
  added_by: Generated<string | null>;
  channel_id: string;
  guild_id: string;
  latest_video: Generated<string | null>;
}

export interface DB {
  configs: Configs;
  mod_channels: ModChannels;
  modmail: Modmail;
  youtube_channels: YoutubeChannels;
}
