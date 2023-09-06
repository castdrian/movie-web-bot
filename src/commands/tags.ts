import { Command } from '@sapphire/framework';
import { ApplicationCommandType, Message, MessageContextMenuCommandInteraction } from 'discord.js';

export class TagsCommand extends Command {
	public override async contextMenuRun(interaction: MessageContextMenuCommandInteraction) {
		if (!interaction.isMessageContextMenuCommand && !(interaction.targetMessage instanceof Message)) return;
		const { author } = interaction.targetMessage;
		await interaction.reply(author.id);
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand((builder) =>
			builder //
				.setName('Send Tag')
				.setType(ApplicationCommandType.Message)
		);
	}
}
