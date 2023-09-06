import { searchTitle } from '#src/util';
import { Command } from '@sapphire/framework';
import { AutocompleteInteraction, CommandInteraction } from 'discord.js';

export class AvailableCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.reply('pong');
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'available') return;
		const { name, value } = interaction.options.getFocused(true);
		if (name !== 'title') return;

		const response = await searchTitle(value);
		await interaction.respond(response);
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('available')
				.setDescription('check if a title is available on movie-web')
				.addStringOption((option) =>
					option //
						.setName('title')
						.setDescription('the title to check')
						.setRequired(true)
						.setAutocomplete(true)
				)
		);
	}
}
