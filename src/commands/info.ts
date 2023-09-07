import { Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

import { Command, version as sversion } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, time, version } from 'discord.js';
import lcl from 'last-commit-log';
import ts from 'typescript';
import pkg from '#package.json' assert { type: 'json' };

export class InfoCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    await interaction.deferReply();

    const embed = {
      title: 'mw-bot info',
      description: `mw-bot v${pkg.version}`,
      thumbnail: {
        url: this.container.client.user?.displayAvatarURL() ?? '',
      },
      color: 0xa87fd1,
    };

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel('Discord').setStyle(ButtonStyle.Link).setURL('https://discord.movie-web.app/'),
      new ButtonBuilder()
        .setLabel('GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/movie-web/movie-web'),
      new ButtonBuilder().setLabel('movie-web.app').setStyle(ButtonStyle.Link).setURL('https://movie-web.app'),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('info')
        .setDescription('info about mw-bot'),
    );
  }
}
