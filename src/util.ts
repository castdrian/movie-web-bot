import { APIEmbed, ApplicationCommandOptionChoiceData, Collection, CommandInteraction, Guild, GuildEmoji } from 'discord.js';
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

export async function fetchMedia(identifier: string): Promise<{ type: 'movie' | 'tv'; result: TvShowDetails | MovieDetails } | undefined> {
	try {
		const [type, id] = identifier.split(':');
		if (id === 'empty') return;

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
		return { type, result };
	} catch (ex) {
		console.log(ex);
		return undefined;
	}
}

export async function checkAvailability(media: ScrapeMedia, posterPath: string, interaction: CommandInteraction): Promise<void> {
	const providers = makeProviders({ fetcher: makeStandardFetcher(fetch as any) });
	const cache = new CacheCollection();

	cache.setMedia(media);
	cache.setPosterPath(posterPath);

	const options: RunnerOptions = {
		media,
		events: {
			init(e) {
				console.log('init', e);
				cache.setSources(e.sourceIds);
				void makeResponseEmbed(cache, interaction);
			},
			start(e) {
				console.log('start', e);
				void makeResponseEmbed(cache, interaction);
			},
			update(e) {
				console.log('update', e);
				void makeResponseEmbed(cache, interaction);
			}
		}
	};

	const results = await providers.runAll(options);

	if (results) {
		const components = [
			{
				type: 1,
				components: [
					{
						type: 2,
						label: 'watch on movie-web',
						style: 5,
						url: `https://movie-web.app/media/tmdb-${media.type}-${media.tmdbId}`
					}
				]
			}
		];
		await interaction.editReply({ components });
	}

	await makeResponseEmbed(cache, interaction, Boolean(results));
}

export function transformSearchResultToScrapeMedia(type: 'tv' | 'movie', result: TvShowDetails | MovieDetails): ScrapeMedia {
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
				number: tvResult.seasons[0].season_number,
				tmdbId: tvResult.seasons[0].id.toString()
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

async function makeResponseEmbed(cache: CacheCollection, interaction: CommandInteraction, success?: boolean): Promise<void> {
	const sources = cache.getSources();
	const media = cache.getMedia();

	if (!sources?.length || !media) {
		return void interaction.editReply('An error occurred while collecting providers.');
	}

	const embed = {
		title: `${media.title} (${media.releaseYear})`,
		description: `\`FlixHQ\` ${getStatusEmote(StatusEmotes.FAILURE, interaction.guild!)}\n\`SuperStream\` ${getStatusEmote(
			StatusEmotes.LOADING,
			interaction.guild!
		)}\n\`GoMovies\` ${getStatusEmote(StatusEmotes.WAITING, interaction.guild!)}`,
		color: 0xa87fd1,
		thumbnail: {
			url: getMediaPoster(cache.getPosterPath()!)
		},
		author: {
			name: `movie-web`,
			icon_url: `https://github.com/movie-web/movie-web/blob/dev/public/android-chrome-512x512.png?raw=true`
		},
		url: `https://movie-web.app/media/tmdb-${media.type}-${media.tmdbId}`,
		timestamp: new Date().toISOString(),
		// eslint-disable-next-line no-negated-condition
		...(success !== undefined
			? {
					footer: {
						text: `${success ? '✅' : '❌'} | found ${cache.getVideos() ?? 0} video${cache.getVideos() === 1 ? '' : 's'}`
					}
			  }
			: {})
	} satisfies APIEmbed;

	await interaction.editReply({ embeds: [embed] });
}

function getMediaPoster(posterPath: string): string {
	return `https://image.tmdb.org/t/p/w185/${posterPath}`;
}

enum StatusEmotes {
	WAITING,
	LOADING,
	SUCCESS,
	FAILURE
}

function getStatusEmote(status: StatusEmotes, guild: Guild): GuildEmoji {
	switch (status) {
		case StatusEmotes.WAITING:
			return guild.emojis.cache.find((emoji) => emoji.name === 'slash')!;
		case StatusEmotes.LOADING:
			return guild.emojis.cache.find((emoji) => emoji.name === 'loading')!;
		case StatusEmotes.SUCCESS:
			return guild.emojis.cache.find((emoji) => emoji.name === 'check')!;
		case StatusEmotes.FAILURE:
			return guild.emojis.cache.find((emoji) => emoji.name === 'error')!;
	}
}

class CacheCollection extends Collection<string, any> {
	public setSources(value: string[]) {
		this.set('sources', value);
	}

	public getSources(): string[] | undefined {
		return this.get('sources') as string[] | undefined;
	}

	public setVideos(value: number) {
		this.set('videos', value);
	}

	public getVideos(): number | undefined {
		return this.get('videos') as number | undefined;
	}

	public setMedia(value: ScrapeMedia) {
		this.set('media', value);
	}

	public getMedia(): ScrapeMedia | undefined {
		return this.get('media') as ScrapeMedia | undefined;
	}

	public setPosterPath(value: string) {
		this.set('posterPath', value);
	}

	public getPosterPath(): string | undefined {
		return this.get('posterPath') as string | undefined;
	}
}
