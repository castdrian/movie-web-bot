import { Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class AvailableCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		await interaction.editReply('not implemented yet');
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
