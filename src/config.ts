import { readFileSync } from 'node:fs';

import TOML from '@ltd/j-toml';
import { APIEmbed, Collection } from 'discord.js';
import { createConfigLoader } from 'neat-config';
import { z } from 'zod';

const schema = z.object({
  discordToken: z.string().nonempty(),
  guildId: z.string().nonempty(),
  tmdbApiKey: z.string().nonempty(),
  tagRefreshUrl: z
    .string()
    .nonempty()
    .default('https://raw.githubusercontent.com/movie-web/discord-bot/master/src/tags.toml'),
  mwIconUrl: z.string().nonempty().default('https://movie-web.app/android-chrome-512x512.png'),
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

export interface TagUrl {
  label: string;
  url: string;
}

interface Tag {
  isContextEnabled: boolean;
  content: string;
  embeds?: APIEmbed[];
  urls?: TagUrl[];
}

const tagSchema: z.ZodType<Tag> = z.object({
  isContextEnabled: z.boolean(),
  content: z.string().nonempty(),
  embeds: z.array(z.any()).nonempty().optional(),
  urls: z
    .array(
      z.object({
        label: z.string().nonempty(),
        url: z.string().url().nonempty(),
      }),
    )
    .nonempty()
    .max(25)
    .optional(),
});

export type TagStore = Record<string, Tag>;

export function validateTags(tagStore: TagStore) {
  for (const [key, tag] of Object.entries(tagStore)) {
    try {
      tagSchema.parse(tag);
    } catch (e: any) {
      throw new z.ZodError([{ message: `Failed to parse tag '${key}'`, ...e }]);
    }
  }
  const contextEnabledTags = Object.values(tagStore).filter((tag) => tag.isContextEnabled);

  if (contextEnabledTags.length === 0) {
    throw new z.ZodError([
      {
        message: 'No context-enabled tags found.',
        code: 'too_small',
        minimum: 1,
        inclusive: true,
        path: ['contextEnabledTags'],
        type: 'array',
      },
    ]);
  }

  if (contextEnabledTags.length > 25) {
    throw new z.ZodError([
      {
        message: 'Too many context-enabled tags. Maximum allowed is 25.',
        code: 'too_big',
        maximum: 25,
        inclusive: true,
        path: ['contextEnabledTags'],
        type: 'array',
      },
    ]);
  }
}

const tagStore = TOML.parse(readFileSync('./src/tags.toml', 'utf8')) as TagStore;
validateTags(tagStore);

export const tagCache = new Collection<string, Tag>();

for (const [key, tag] of Object.entries(tagStore)) {
  tagCache.set(key, tag);
}
