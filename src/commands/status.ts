import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';

import { mwUrls } from '#src/config';
import { isRealError } from '#src/util';

export class StatusCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      await interaction.deferReply();

      const filteredMwUrls = mwUrls.filter((url) => url.trim() !== 'https://movie-web.x');
      const description = await Promise.all(
        filteredMwUrls.map(async (url) => {
          const { ok } = await fetch(url).catch(() => ({ ok: false }));
          return `**${url}** ${ok ? `🟢 UP` : '🔴 DOWN'}`;
        }),
      ).then((lines) => lines.join('\n'));

      const embeds = [
        {
          title: 'mw status',
          description,
          thumbnail: {
            url: this.container.client.user!.displayAvatarURL(),
          },
          color: 0xa87fd1,
        },
      ];

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Instance Info')
          .setEmoji('ℹ️')
          .setStyle(ButtonStyle.Link)
          .setURL('https://movie-web.github.io/docs/instances#community-instances'),
      );

      await interaction.editReply({ embeds, components: [row] });
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
