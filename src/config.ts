import { createConfigLoader } from 'neat-config';
import { z } from 'zod';

const schema = z.object({
	discordToken: z.string(),
	guildId: z.string(),
	tmdbApiKey: z.string()
});

const prefix = 'CONF_';

export const config = createConfigLoader().addFromFile('.env', { prefix }).addFromEnvironment(prefix).addZodSchema(schema).load();
