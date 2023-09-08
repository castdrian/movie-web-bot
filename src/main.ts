import { ApplicationCommandRegistries, LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import '@sapphire/plugin-logger/register';
import fastify from 'fastify';
import metricsPlugin from 'fastify-metrics';

import { config } from '#src/config';

ApplicationCommandRegistries.setDefaultGuildIds([config.guildId]);

const app = fastify();
await app.register(metricsPlugin.default, { endpoint: '/metrics' });
await app.listen({ port: 8080 });

const client = new SapphireClient({
  shards: 'auto',
  intents: [GatewayIntentBits.Guilds],
  logger: {
    level: LogLevel.Debug,
  },
});

await client.login(config.discordToken);
