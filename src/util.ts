import { ApplicationCommandOptionChoiceData } from 'discord.js';
import { TMDB } from 'tmdb-ts';
import { config } from '#src/config';

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
