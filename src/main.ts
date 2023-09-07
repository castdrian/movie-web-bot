import { ApplicationCommandRegistries, LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

import { config } from '#src/config';
import '@sapphire/plugin-logger/register';

ApplicationCommandRegistries.setDefaultGuildIds([config.guildId]);

const client = new SapphireClient({
	shards: 'auto',
	intents: [GatewayIntentBits.Guilds],
	logger: {
		level: LogLevel.Debug
	}
});

if (!config.discordToken) process.exit(0);

await client.login(config.discordToken);
