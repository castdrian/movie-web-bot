import { readFileSync } from 'node:fs';

import TOML from '@ltd/j-toml';
import { Collection } from 'discord.js';
import { createConfigLoader } from 'neat-config';
import { z } from 'zod';

const schema = z.object({
  discordToken: z.string(),
  guildId: z.string(),
  tmdbApiKey: z.string(),
  tagRefreshUrl: z.string().default('https://raw.githubusercontent.com/movie-web/discord-bot/master/src/tags.toml'),
  mwIconUrl: z.string().default('https://movie-web.app/android-chrome-512x512.png'),
});

const prefix = 'CONF_';

export enum Status {
  WAITING,
  LOADING,
  SUCCESS,
  FAILURE,
}

export const statusEmojiIds = {
  [Status.WAITING]: ['1149017166478327900', '1149114608309784739'],
  [Status.LOADING]: ['1149016985699627018', '1149114549748899860'],
  [Status.SUCCESS]: ['1149017114515083386', '1149114472158474290'],
  [Status.FAILURE]: ['1149017090670465054', '1149114672042213406'],
};

export const config = createConfigLoader()
  .addFromFile('.env', { prefix })
  .addFromEnvironment(prefix)
  .addZodSchema(schema)
  .load();

export interface TagStore {
  tags: Record<string, string>;
}

const tagStore = TOML.parse(readFileSync('./src/tags.toml', 'utf8')) as unknown as TagStore;
export const tagCache = new Collection<string, string>();

for (const [key, value] of Object.entries(tagStore.tags)) {
  tagCache.set(key, value);
}
