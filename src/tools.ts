import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Interfaces
export interface MovieSearchResult {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  vote_average: number;
  popularity: number;
}

export interface MovieDetails {
  id: number;
  title: string;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  overview: string;
  vote_average: number;
  vote_count: number;
  budget: number;
  revenue: number;
  production_companies: { id: number; name: string }[];
  tagline: string;
}

export interface TVShowSearchResult {
  id: number;
  name: string;
  first_air_date: string;
  overview: string;
  vote_average: number;
  popularity: number;
}

export interface TVShowDetails {
  id: number;
  name: string;
  first_air_date: string;
  last_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  overview: string;
  vote_average: number;
  vote_count: number;
  status: string;
  tagline: string;
}

export interface TVEpisodeDetails {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  vote_average: number;
  runtime: number;
}

export interface WatchProviderOffer {
  provider_name: string;
}

export interface WatchProviderRegion {
  link?: string;
  flatrate?: WatchProviderOffer[];
  rent?: WatchProviderOffer[];
  buy?: WatchProviderOffer[];
  free?: WatchProviderOffer[];
  ads?: WatchProviderOffer[];
}

export interface WatchProvidersTarget {
  movie_id?: number;
  imdb_id?: string;
  region?: string;
  media_type?: "movie" | "tv";
}

// Define all possible tools (OMDB tools listed first as primary)
export const ALL_TOOLS: Array<Tool & { provider: 'TMDB' | 'OMDB' }> = [
  {
    name: "get_movie_by_imdb",
    description:
      "Get movie information using IMDB ID via OMDB API. Provides ratings from multiple sources and additional metadata.",
    inputSchema: {
      type: "object",
      properties: {
        imdb_id: {
          type: "string",
          description: "The IMDB ID (e.g., tt0111161)",
        },
      },
      required: ["imdb_id"],
    },
    provider: "OMDB",
  },
  {
    name: "search_movies",
    description:
      "Search for movies by title using TMDB API. Returns a list of matching movies with basic information.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The movie title to search for",
        },
        year: {
          type: "number",
          description: "Optional release year to filter results",
        },
      },
      required: ["query"],
    },
    provider: "TMDB",
  },
  {
    name: "get_movie_details",
    description:
      "Get detailed information about a specific movie using TMDB ID. Returns comprehensive metadata including genres, runtime, budget, revenue, and more.",
    inputSchema: {
      type: "object",
      properties: {
        movie_id: {
          type: "number",
          description: "The TMDB movie ID",
        },
      },
      required: ["movie_id"],
    },
    provider: "TMDB",
  },
  {
    name: "get_popular_movies",
    description:
      "Get a list of currently popular movies from TMDB. Useful for discovering trending content.",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
      },
    },
    provider: "TMDB",
  },
  {
    name: "analyze_movie_performance",
    description:
      "Analyze movie performance metrics including ROI, ratings, and popularity. Requires TMDB movie ID.",
    inputSchema: {
      type: "object",
      properties: {
        movie_id: {
          type: "number",
          description: "The TMDB movie ID to analyze",
        },
      },
      required: ["movie_id"],
    },
    provider: "TMDB",
  },
  {
    name: "search_tv_shows",
    description:
      "Search for TV shows by name using TMDB API. Returns a list of matching TV shows with basic information.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The TV show name to search for",
        },
        year: {
          type: "number",
          description: "Optional first air year to filter results",
        },
      },
      required: ["query"],
    },
    provider: "TMDB",
  },
  {
    name: "get_tv_show_details",
    description:
      "Get detailed information about a specific TV show using TMDB ID. Returns comprehensive metadata including genres, number of seasons/episodes, and more.",
    inputSchema: {
      type: "object",
      properties: {
        tv_id: {
          type: "number",
          description: "The TMDB TV show ID",
        },
      },
      required: ["tv_id"],
    },
    provider: "TMDB",
  },
  {
    name: "get_tv_episode_details",
    description:
      "Get detailed information about a specific TV episode using TMDB TV show ID, season number, and episode number. Returns episode name, air date, overview, and more.",
    inputSchema: {
      type: "object",
      properties: {
        tv_id: {
          type: "number",
          description: "The TMDB TV show ID",
        },
        season_number: {
          type: "number",
          description: "The season number",
        },
        episode_number: {
          type: "number",
          description: "The episode number",
        },
      },
      required: ["tv_id", "season_number", "episode_number"],
    },
    provider: "TMDB",
  },
  {
    name: "get_watch_providers",
    description:
      "Get the streaming, rental and purchase options for a movie or TV show in a given country, using TMDB watch provider data (sourced from JustWatch). Accepts either a TMDB id or an IMDB id (e.g. tt35298123). Defaults to region CA.",
    inputSchema: {
      type: "object",
      properties: {
        movie_id: {
          type: "number",
          description: "The TMDB movie ID (or TV show ID when media_type is 'tv')",
        },
        imdb_id: {
          type: "string",
          description: "The IMDB ID (e.g., tt35298123), resolved to a TMDB id automatically",
        },
        region: {
          type: "string",
          description: "ISO 3166-1 country code to report offers for (default: CA)",
        },
        media_type: {
          type: "string",
          enum: ["movie", "tv"],
          description: "Which TMDB catalogue movie_id belongs to (default: movie)",
        },
      },
    },
    provider: "TMDB",
  },
];

// Build available tools based on configured API keys (prioritizes OMDB)
export function getAvailableTools(omdbAvailable: boolean, tmdbAvailable: boolean): Tool[] {
  return ALL_TOOLS.filter((tool) => {
    if (tool.provider === "OMDB") return omdbAvailable;
    if (tool.provider === "TMDB") return tmdbAvailable;
    return false;
  }).map(({ provider, ...tool }) => tool);
}

// API Helper Functions (OMDB first as primary)
export async function fetchFromOMDB(
  params: Record<string, string>,
  apiKey: string,
  baseUrl: string = "https://www.omdbapi.com"
): Promise<any> {
  if (!apiKey) {
    throw new Error(
      "OMDB API is not configured. Please set the OMDB_API_KEY environment variable. " +
      "Get your free API key at https://www.omdbapi.com/apikey.aspx"
    );
  }

  const searchParams = new URLSearchParams({
    ...params,
    apikey: apiKey,
  });

  const url = `${baseUrl}?${searchParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function fetchFromTMDB(
  endpoint: string,
  apiKey: string,
  baseUrl: string = "https://api.themoviedb.org/3"
): Promise<any> {
  if (!apiKey) {
    throw new Error(
      "TMDB API is not configured. Please set the TMDB_API_KEY environment variable. " +
      "Get your free API key at https://www.themoviedb.org/settings/api"
    );
  }

  const url = `${baseUrl}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }api_key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Tool Implementation Functions (OMDB tools first)
export async function getMovieByIMDB(imdbId: string, apiKey: string): Promise<string> {
  const data = await fetchFromOMDB({ i: imdbId, plot: "full" }, apiKey);

  if (data.Response === "False") {
    throw new Error(data.Error || "Movie not found");
  }

  return JSON.stringify(data, null, 2);
}

export async function searchMovies(query: string, apiKey: string, year?: number): Promise<string> {
  const endpoint = `/search/movie?query=${encodeURIComponent(query)}${
    year ? `&year=${year}` : ""
  }`;

  const data = await fetchFromTMDB(endpoint, apiKey);

  const results: MovieSearchResult[] = data.results.slice(0, 10);

  return JSON.stringify(
    {
      total_results: data.total_results,
      results: results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
      })),
    },
    null,
    2
  );
}

export async function getMovieDetails(movieId: number, apiKey: string): Promise<string> {
  const data: MovieDetails = await fetchFromTMDB(`/movie/${movieId}`, apiKey);

  return JSON.stringify(
    {
      id: data.id,
      title: data.title,
      tagline: data.tagline,
      release_date: data.release_date,
      runtime: data.runtime,
      genres: data.genres.map((g) => g.name),
      overview: data.overview,
      vote_average: data.vote_average,
      vote_count: data.vote_count,
      budget: data.budget,
      revenue: data.revenue,
      production_companies: data.production_companies.map((pc) => pc.name),
    },
    null,
    2
  );
}

export async function getPopularMovies(apiKey: string, page: number = 1): Promise<string> {
  const data = await fetchFromTMDB(`/movie/popular?page=${page}`, apiKey);

  return JSON.stringify(
    {
      page: data.page,
      total_pages: data.total_pages,
      results: data.results.map((movie: MovieSearchResult) => ({
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
      })),
    },
    null,
    2
  );
}

export async function analyzeMoviePerformance(movieId: number, apiKey: string): Promise<string> {
  const data: MovieDetails = await fetchFromTMDB(`/movie/${movieId}`, apiKey);

  const roi =
    data.budget > 0 ? ((data.revenue - data.budget) / data.budget) * 100 : 0;

  const analysis = {
    title: data.title,
    financial_performance: {
      budget: data.budget,
      revenue: data.revenue,
      profit: data.revenue - data.budget,
      roi_percentage: roi.toFixed(2),
      status:
        roi > 100
          ? "Highly Profitable"
          : roi > 0
          ? "Profitable"
          : roi === 0
          ? "Break Even or Unknown"
          : "Loss",
    },
    audience_reception: {
      vote_average: data.vote_average,
      vote_count: data.vote_count,
      rating_category:
        data.vote_average >= 8
          ? "Excellent"
          : data.vote_average >= 7
          ? "Good"
          : data.vote_average >= 6
          ? "Average"
          : "Below Average",
    },
    production_info: {
      runtime_minutes: data.runtime,
      genres: data.genres.map((g) => g.name),
      production_companies: data.production_companies.map((pc) => pc.name),
    },
  };

  return JSON.stringify(analysis, null, 2);
}

export async function searchTVShows(query: string, apiKey: string, year?: number): Promise<string> {
  const endpoint = `/search/tv?query=${encodeURIComponent(query)}${
    year ? `&first_air_date_year=${year}` : ""
  }`;

  const data = await fetchFromTMDB(endpoint, apiKey);

  const results: TVShowSearchResult[] = data.results.slice(0, 10);

  return JSON.stringify(
    {
      total_results: data.total_results,
      results: results.map((show) => ({
        id: show.id,
        name: show.name,
        first_air_date: show.first_air_date,
        overview: show.overview,
        vote_average: show.vote_average,
        popularity: show.popularity,
      })),
    },
    null,
    2
  );
}

export async function getTVShowDetails(tvId: number, apiKey: string): Promise<string> {
  const data: TVShowDetails = await fetchFromTMDB(`/tv/${tvId}`, apiKey);

  return JSON.stringify(
    {
      id: data.id,
      name: data.name,
      first_air_date: data.first_air_date,
      last_air_date: data.last_air_date,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      genres: data.genres.map((g) => g.name),
      overview: data.overview,
      vote_average: data.vote_average,
      vote_count: data.vote_count,
      status: data.status,
    },
    null,
    2
  );
}

export async function getTVEpisodeDetails(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number,
  apiKey: string
): Promise<string> {
  const data: TVEpisodeDetails = await fetchFromTMDB(
    `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
    apiKey
  );

  return JSON.stringify(
    {
      id: data.id,
      name: data.name,
      episode_number: data.episode_number,
      season_number: data.season_number,
      air_date: data.air_date,
      overview: data.overview,
      vote_average: data.vote_average,
      runtime: data.runtime,
    },
    null,
    2
  );
}

function providerNames(offers?: WatchProviderOffer[]): string[] {
  return (offers ?? []).map((offer) => offer.provider_name);
}

export async function getWatchProviders(
  target: WatchProvidersTarget,
  apiKey: string
): Promise<string> {
  const region = (target.region ?? "CA").toUpperCase();
  let mediaType: "movie" | "tv" = target.media_type ?? "movie";
  let tmdbId = target.movie_id;

  if (tmdbId === undefined) {
    if (!target.imdb_id) {
      throw new Error("Either movie_id or imdb_id must be provided");
    }

    const found = await fetchFromTMDB(
      `/find/${encodeURIComponent(target.imdb_id)}?external_source=imdb_id`,
      apiKey
    );

    if (found.movie_results?.length) {
      tmdbId = found.movie_results[0].id;
      mediaType = "movie";
    } else if (found.tv_results?.length) {
      tmdbId = found.tv_results[0].id;
      mediaType = "tv";
    } else {
      throw new Error(`No TMDB match for IMDB id ${target.imdb_id}`);
    }
  }

  const data = await fetchFromTMDB(
    `/${mediaType}/${tmdbId}/watch/providers`,
    apiKey
  );

  const attribution =
    "Watch provider data from JustWatch, via TMDB. Offers change often — check the link before paying.";
  const regions: Record<string, WatchProviderRegion> = data.results ?? {};
  const offers = regions[region];

  if (!offers) {
    return JSON.stringify(
      {
        media_type: mediaType,
        tmdb_id: tmdbId,
        region,
        available: false,
        message: `No watch providers listed for region ${region}.`,
        available_regions: Object.keys(regions).sort(),
        attribution,
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      media_type: mediaType,
      tmdb_id: tmdbId,
      region,
      available: true,
      link: offers.link,
      streaming: providerNames(offers.flatrate),
      rent: providerNames(offers.rent),
      buy: providerNames(offers.buy),
      free: providerNames(offers.free),
      ads: providerNames(offers.ads),
      attribution,
    },
    null,
    2
  );
}
