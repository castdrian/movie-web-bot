import { Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

import { tagCache } from '#src/config';
import { isRealError, updateCacheFromRemote } from '#src/util';

export class RefreshCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      await updateCacheFromRemote();
      await interaction.editReply(
        `Refreshed tag cache with \`${tagCache.size}\` tag${tagCache.size === 1 ? '' : 's'}.`,
      );
    } catch (ex) {
      if (isRealError(ex as Error)) {
        throw ex;
      }
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('refresh')
        .setDescription('refresh the tag cache')
        .setDefaultMemberPermissions(0),
    );
  }
}
