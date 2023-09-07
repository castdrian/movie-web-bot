import { cpus, totalmem } from 'os';

import { Command, version as sversion } from '@sapphire/framework';
import { CommandInteraction, time, version } from 'discord.js';
import lcl from 'last-commit-log';
import ts from 'typescript';

export class InfoCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    await interaction.deferReply();

    const { readyAt } = this.container.client;
    const uptimeString = time(readyAt!, 'R');

    const cpuCount = cpus().length;
    const cpuModel = cpus()[0].model;
    const osString = `${process.platform} ${cpuCount}x ${cpuModel}`;

    const memory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryString = `${memory.toFixed(2)} MB / ${Math.round(totalmem() / 1024 / 1024)} MB`;

    const shard = this.container.client.shard?.ids[0] ?? 0;
    const shardCount = this.container.client.shard?.count ?? 1;
    const shardString = `${shard} (${shardCount} total)`;

    const lclInstance = new lcl(process.cwd());
    const lastCommit = await lclInstance.getLastCommit();
    const { gitUrl, shortHash, subject } = lastCommit;
    const commitString = `[${shortHash}](${gitUrl}) - ${subject}`;

    const node = `[${process.version}](https://nodejs.org/en/download/releases/)`;
    const tsver = `[v${ts.version}](https://www.typescriptlang.org/download)`;
    const latency = this.container.client.ws.ping;
    const djs = `[v${version}](https://discord.js.org)`;
    const sapphire = `[v${sversion}](https://sapphirejs.dev)`;

    const embed = {
      title: 'mw-bot info',
      thumbnail: {
        url: this.container.client.user?.displayAvatarURL() ?? '',
      },
      description: `**Uptime:** Container started ${uptimeString}\n**Latency:** ${latency} ms\n**System:** ${osString}\n**Memory Usage:** ${memoryString}\n**Shard:** ${shardString}\n**Current Commit:** ${commitString}\n**Node:** ${node}\n**TypeScript:** ${tsver}\n**Discord.js:** ${djs}\n**Sapphire:** ${sapphire}`,
      color: 0xa87fd1,
    };

    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: 'Contact',
            style: 5,
            url: 'discord://-/users/135081860790222848',
          },
          {
            type: 2,
            label: 'Discord',
            style: 5,
            url: 'https://discord.movie-web.app/',
          },
          {
            type: 2,
            label: 'GitHub',
            style: 5,
            url: 'https://github.com/movie-web/movie-web',
          },
          {
            type: 2,
            label: 'movie-web.app',
            style: 5,
            url: 'https://movie-web.app',
          },
        ],
      },
    ];

    await interaction.editReply({ embeds: [embed], components });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('info')
        .setDescription('info about mw-bot'),
    );
  }
}
