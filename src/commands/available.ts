import { Command } from '@sapphire/framework';
import { AutocompleteInteraction, CommandInteraction } from 'discord.js';

import { checkAvailability, fetchMedia, searchTitle, transformSearchResultToScrapeMedia } from '#src/util';

export class AvailableCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      if (!interaction.isChatInputCommand()) return;
      if (!interaction.inCachedGuild()) return;

      const identifier = interaction.options.getString('title', true);

      const media = await fetchMedia(identifier);
      if (!media) return interaction.reply({ content: 'No results found', ephemeral: true });
      await interaction.deferReply();

      const { type, result } = media;
      let season: number | undefined;
      let episode: number | undefined;

      if (type === 'tv') {
        season = interaction.options.getInteger('season') ?? undefined;
        episode = interaction.options.getInteger('episode') ?? undefined;
      }

      const scrapeMedia = transformSearchResultToScrapeMedia(type, result, season, episode);

      await checkAvailability(scrapeMedia, result.poster_path ?? '', interaction);
    } catch (ex) {
      interaction.client.logger.error(ex);

      if (interaction.replied) {
        await interaction.followUp({ content: 'Something went wrong', ephemeral: true });
      }

      await interaction.reply({ content: 'Something went wrong', ephemeral: true });
    }
    return undefined;
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
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          option //
            .setName('season')
            .setDescription('the season to check'),
        )
        .addIntegerOption((option) =>
          option //
            .setName('episode')
            .setDescription('the episode to check'),
        ),
    );
  }
}
