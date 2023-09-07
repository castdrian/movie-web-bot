import { tagCache } from '#src/config';
import { updateCacheFromRemote } from '#src/util';
import { Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class RefreshCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		await updateCacheFromRemote();
		await interaction.editReply(`Refreshed tag cache with \`${tagCache.size}\` tag${tagCache.size === 1 ? '' : 's'}.`);
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('refresh')
				.setDescription('refresh the tag cache')
				.setDefaultMemberPermissions(0)
		);
	}
}
