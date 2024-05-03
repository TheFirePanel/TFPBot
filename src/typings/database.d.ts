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
  dm_channel_id: string;
  guild_id: string;
  id: unknown;
  message: Generated<string | null>;
  user_id: Generated<string | null>;
}

export interface Warnings {
  created_at: Generated<Date>;
  guild_id: string;
  id: unknown;
  mod_id: string;
  reason: Generated<string | null>;
  user_id: string;
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
  warnings: Warnings;
  youtube_channels: YoutubeChannels;
}
