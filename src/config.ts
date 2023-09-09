import { readFileSync } from 'node:fs';

import TOML from '@ltd/j-toml';
import { APIEmbed, ActionRowData, Collection, MessageActionRowComponentData } from 'discord.js';
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

interface Tag {
  isContextEnabled: boolean;
  content: string;
  embeds?: APIEmbed[];
  components?: ActionRowData<MessageActionRowComponentData>[];
}

const tagSchema: z.ZodType<Tag> = z.object({
  isContextEnabled: z.boolean(),
  content: z.string(),
  embeds: z.array(z.any()).optional(),
  components: z.array(z.any()).optional(),
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
