import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';

import { config, mwUrls } from '#src/config';
import { isRealError } from '#src/util';

export class StatusCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      await interaction.deferReply();

      const description = await Promise.all(
        mwUrls.map(async (url) => {
          const { ok } = await fetch(url).catch(() => ({ ok: false }));
          return `**${url}** ${ok ? `🟢 UP` : '🔴 DOWN'}`;
        }),
      ).then((lines) => lines.join('\n'));

      const embeds = [
        {
          title: 'mw status',
          description,
          thumbnail: {
            url: this.container.client.user?.displayAvatarURL() ?? config.mwIconUrl,
          },
          color: 0xa87fd1,
        },
      ];

      const components = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('submit your mirror')
            .setStyle(ButtonStyle.Link)
            .setURL('https://github.com/movie-web/discord-bot/edit/dev/src/mw-urls.txt'),
        ),
      ];

      await interaction.editReply({ embeds, components });
    } catch (ex) {
      if (isRealError(ex as Error)) {
        throw ex;
      }
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('status')
        .setDescription('movie-web status'),
    );
  }
}
