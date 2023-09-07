import { APIEmbed, ApplicationCommandOptionChoiceData, Client, Collection, CommandInteraction, GuildEmoji } from 'discord.js';
import { MovieDetails, TMDB, TvShowDetails } from 'tmdb-ts';
import { Status, TagStore, config, statusEmojiIds, tagCache } from '#src/config';
import { RunnerOptions, ScrapeMedia, makeProviders, makeStandardFetcher } from '@movie-web/providers';
import TOML from '@ltd/j-toml';

const tmdb = new TMDB(config.tmdbApiKey);

export async function updateCacheFromRemote() {
	const res = await fetch(config.tagRefreshUrl)
		.then((res) => res.text())
		.catch(() => null);

	if (!res) return;

	const tagsStore = TOML.parse(res) as unknown as TagStore;

	for (const [key, value] of Object.entries(tagsStore.tags)) {
		tagCache.set(key, value);
	}
}

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
				cache.setSources(e.sourceIds);
				cache.setStatus(e.sourceIds.map((id) => ({ id, status: Status.WAITING, current: false })));
				void makeResponseEmbed(cache, interaction);
			},
			start(e) {
				const status = cache.getStatus();
				if (!status) return;
				const sourceStatus = status.find((s) => s.id === e);
				if (!sourceStatus) return;
				sourceStatus.status = Status.LOADING;

				status.forEach((s) => {
					if (s.id === e) return;
					s.current = false;
				});
				sourceStatus.current = true;

				cache.setStatus(status);
				void makeResponseEmbed(cache, interaction);
			},
			update(e) {
				const status = cache.getStatus();
				if (!status) return;
				// const sourceStatus = status.find((s) => s.id === e.id);
				const sourceStatus = status.find((s) => s.current);
				if (!sourceStatus) return;

				switch (e.status) {
					case 'success':
						sourceStatus.status = Status.SUCCESS;
						break;
					case 'failure':
						sourceStatus.status = Status.FAILURE;
						break;
					case 'notfound':
						sourceStatus.status = Status.FAILURE;
						break;
					case 'pending':
						sourceStatus.status = Status.LOADING;
						break;
				}

				cache.setStatus(status);
				void makeResponseEmbed(cache, interaction);
			}
		}
	};

	const results = await providers.runAll(options);
	const status = cache.getStatus();

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

	if (status) {
		status.forEach((s) => {
			if (s.status === Status.LOADING) s.status = Status.SUCCESS;
		});
		cache.setStatus(status);
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
	const status = cache.getStatus();

	if (!sources?.length || !media || !status) {
		return void interaction.editReply('An error occurred while collecting providers.');
	}

	const description = sources
		.map((source) => {
			const sourceStatus = status.find((s) => s.id === source);
			if (!sourceStatus) return undefined;
			return `\`${source}\` ${getStatusEmote(sourceStatus.status, interaction.client)}`;
		})
		.filter((s) => s)
		.join('\n');

	const embed = {
		title: `${media.title} (${media.releaseYear})`,
		description,
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
						text: `${success ? '✅ | found media' : '❌ | no media found'}`
					}
			  }
			: {})
	} satisfies APIEmbed;

	await interaction.editReply({ embeds: [embed] });
}

function getMediaPoster(posterPath: string): string {
	return `https://image.tmdb.org/t/p/w185/${posterPath}`;
}

interface ProviderStatus {
	id: string;
	status: Status;
	current: boolean;
}

function getStatusEmote(status: Status, client: Client): GuildEmoji {
	return client.emojis.cache.find((emoji) => emoji.id === statusEmojiIds[status].find((id) => emoji.id === id))!;
}

class CacheCollection extends Collection<string, any> {
	public setSources(value: string[]) {
		this.set('sources', value);
	}

	public getSources(): string[] | undefined {
		return this.get('sources') as string[] | undefined;
	}

	public getStatus(): ProviderStatus[] | undefined {
		return this.get('status') as ProviderStatus[] | undefined;
	}

	public setStatus(value: ProviderStatus[]) {
		this.set('status', value);
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
