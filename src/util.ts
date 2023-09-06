import { ApplicationCommandOptionChoiceData, CommandInteraction } from 'discord.js';
import { MovieWithMediaType, MultiSearchResult, TMDB, TVWithMediaType } from 'tmdb-ts';
import { config } from '#src/config';
import { RunnerOptions, ScrapeMedia, makeProviders, makeStandardFetcher } from '@movie-web/providers';

const tmdb = new TMDB(config.tmdbApiKey);

export async function searchTitle(query: string): Promise<ApplicationCommandOptionChoiceData[]> {
	try {
		const rawResults = await tmdb.search.multi({ query, page: 1, include_adult: false });
		const results = rawResults.results.filter((result) => result.media_type === 'tv' || result.media_type === 'movie');

		if (!results.length) return [{ name: 'No results found', value: 'empty' }];

		return results.slice(0, 25).map((result) => {
			if (result.media_type === 'tv') {
				return { name: result.name, value: result.id.toString() };
			}
			if (result.media_type === 'movie') {
				return { name: result.title, value: result.id.toString() };
			}
			return { name: 'No results found', value: 'empty' };
		});
	} catch (ex) {
		return [{ name: 'No results found', value: 'empty' }];
	}
}

export async function fetchMedia(query: string, id: string): Promise<ScrapeMedia | undefined> {
	try {
		const rawResults = await tmdb.search.multi({ query, page: 1, include_adult: false });
		const results = rawResults.results.filter((result) => result.media_type === 'tv' || result.media_type === 'movie');

		if (!results.length) return;

		const result = results.find((result) => result.id.toString() === id);
		if (!result) return;

		return transformSearchResultToScrapeMedia(result);
	} catch (ex) {
		console.log(ex);
		return undefined;
	}
}

export async function checkAvailability(media: ScrapeMedia, interaction: CommandInteraction): Promise<void> {
	const providers = makeProviders({ fetcher: makeStandardFetcher(fetch as any) });

	const options: RunnerOptions = {
		media,
		events: {
			init(e) {
				console.log('init', e);
			},
			start(e) {
				console.log('start', e);
			},
			update(e) {
				console.log('update', e);
			},
			discoverEmbeds(e) {
				console.log('discoverEmbeds', e);
			}
		}
	};

	const results = await providers.runAll(options);
	if (!results) return;
	console.log(results);
	await interaction.editReply('pong');
}

function transformSearchResultToScrapeMedia(result: MultiSearchResult): ScrapeMedia {
	switch (result.media_type as 'tv' | 'movie') {
		case 'tv':
			return {
				type: 'show',
				tmdbId: result.id.toString(),
				title: (result as TVWithMediaType).name,
				releaseYear: new Date((result as TVWithMediaType).first_air_date).getFullYear(),
				episode: {
					number: 1,
					tmdbId: ''
				},
				season: {
					number: 1,
					tmdbId: ''
				}
			};

		case 'movie':
			return {
				type: 'movie',
				tmdbId: result.id.toString(),
				title: (result as MovieWithMediaType).title,
				releaseYear: new Date((result as MovieWithMediaType).release_date).getFullYear()
			};
	}
}
