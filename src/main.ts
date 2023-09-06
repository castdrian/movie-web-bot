import { GatewayIntentBits } from 'discord.js';
import { LogLevel, SapphireClient } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import { config } from '#src/config';

const client = new SapphireClient({
	shards: 'auto',
	intents: [GatewayIntentBits.Guilds],
	logger: {
		level: LogLevel.Debug
	}
});

if (!config.discordToken) process.exit(0);

await client.login(config.discordToken);
