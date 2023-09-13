import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';

import pkg from '#package.json' assert { type: 'json' };
import { config } from '#src/config';
import { isRealError } from '#src/util';

export class InfoCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      await interaction.deferReply();

      const embed = {
        title: 'mw-bot info',
        description: `mw-bot v${pkg.version}`,
        thumbnail: {
          url: this.container.client.user?.displayAvatarURL() ?? config.mwIconUrl,
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
    } catch (ex) {
      if (isRealError(ex as Error)) {
        throw ex;
      }
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('info')
        .setDescription('info about mw-bot'),
    );
  }
}
