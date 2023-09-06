import { ApplicationCommandOptionChoiceData, CommandInteraction } from 'discord.js';
import { MovieDetails, TMDB, TvShowDetails } from 'tmdb-ts';
import { config } from '#src/config';
import { RunnerOptions, ScrapeMedia, makeProviders, makeStandardFetcher } from '@movie-web/providers';

const tmdb = new TMDB(config.tmdbApiKey);

export async function searchTitle(query: string): Promise<ApplicationCommandOptionChoiceData[]> {
	try {
		const rawResults = await tmdb.search.multi({ query, page: 1, include_adult: false });
		const results = rawResults.results.filter((result) => result.media_type === 'tv' || result.media_type === 'movie');

		if (!results.length) return [{ name: 'No results found', value: 'empty' }];

		return results.slice(0, 25).map((result) => {
			const identifier = `${result.media_type}:${result.id}`;
			if (result.media_type === 'tv') {
				return { name: result.name, value: identifier };
			}
			if (result.media_type === 'movie') {
				return { name: result.title, value: identifier };
			}
			return { name: 'No results found', value: 'empty' };
		});
	} catch (ex) {
		return [{ name: 'No results found', value: 'empty' }];
	}
}

export async function fetchMedia(identifier: string): Promise<ScrapeMedia | undefined> {
	try {
		const [type, id] = identifier.split(':');
		let result: TvShowDetails | MovieDetails;

		switch (type) {
			case 'tv':
				result = await tmdb.tvShows.details(parseInt(id, 10));
				break;
			case 'movie':
				result = await tmdb.movies.details(parseInt(id, 10));
				break;
			default:
				return undefined;
		}

		if (!result) return;
		return transformSearchResultToScrapeMedia(type, result);
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

function transformSearchResultToScrapeMedia(type: 'tv' | 'movie', result: TvShowDetails | MovieDetails): ScrapeMedia {
	if (type === 'tv') {
		const tvResult = result as TvShowDetails;
		return {
			type: 'show',
			tmdbId: tvResult.id.toString(),
			title: tvResult.name,
			releaseYear: new Date(tvResult.first_air_date).getFullYear(),
			episode: {
				number: 1,
				tmdbId: ''
			},
			season: {
				number: 1,
				tmdbId: ''
			}
		};
	}
	if (type === 'movie') {
		const movieResult = result as MovieDetails;
		return {
			type: 'movie',
			tmdbId: movieResult.id.toString(),
			title: movieResult.title,
			releaseYear: new Date(movieResult.release_date).getFullYear()
		};
	}

	throw new Error('Invalid type parameter');
}
