import { createConfigLoader } from 'neat-config';
import TOML from '@ltd/j-toml';
import { z } from 'zod';
import { Collection } from 'discord.js';
import { readFileSync } from 'node:fs';

const schema = z.object({
	discordToken: z.string(),
	guildId: z.string(),
	tmdbApiKey: z.string()
});

const prefix = 'CONF_';

export const config = createConfigLoader().addFromFile('.env', { prefix }).addFromEnvironment(prefix).addZodSchema(schema).load();

interface TagStore {
	tags: Record<string, string>;
}

const tagStore = TOML.parse(readFileSync('./src/tags.toml', 'utf8')) as unknown as TagStore;
export const tagCache = new Collection<string, string>();

for (const [key, value] of Object.entries(tagStore.tags)) {
	tagCache.set(key, value);
}
