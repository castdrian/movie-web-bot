import { Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

import { isRealError } from '#src/util';

export class StatusCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      await interaction.deferReply();

      const host = 'https://movie-web.app/';
      const { ok } = await fetch(host);

      const embed = {
        title: 'mw status',
        description: `**Host:** ${host}\n**Status:** ${ok ? `🟢 UP` : '🔴 DOWN'}`,
        thumbnail: {
          url: this.container.client.user?.displayAvatarURL() ?? 'https://movie-web.app/android-chrome-512x512.png',
        },
        color: 0xa87fd1,
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (ex) {
      if (!isRealError(ex as Error)) {
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
