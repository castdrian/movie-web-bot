import './consoleOverride.js';

import { ApplicationCommandRegistries, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import fastify from 'fastify';
import metricsPlugin from 'fastify-metrics';
import '@sapphire/plugin-logger/register';

import { config } from '#src/config';

ApplicationCommandRegistries.setDefaultGuildIds([config.guildId]);

const app = fastify();
await app.register(metricsPlugin.default, { endpoint: '/metrics' });
await app.listen({ port: 8080, host: '0.0.0.0' });

const client = new SapphireClient({
  shards: 'auto',
  intents: [GatewayIntentBits.Guilds],
});

await client.login(config.discordToken);
