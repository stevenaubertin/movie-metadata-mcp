#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// OMDB API Configuration (Primary)
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = "https://www.omdbapi.com";
const OMDB_AVAILABLE = !!OMDB_API_KEY;

// TMDB API Configuration (Secondary)
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_AVAILABLE = !!TMDB_API_KEY;

interface MovieSearchResult {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  vote_average: number;
  popularity: number;
}

interface MovieDetails {
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

interface TVShowSearchResult {
  id: number;
  name: string;
  first_air_date: string;
  overview: string;
  vote_average: number;
  popularity: number;
}

interface TVShowDetails {
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

interface TVEpisodeDetails {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  vote_average: number;
  runtime: number;
}

// Define all possible tools (OMDB tools listed first as primary)
const ALL_TOOLS: Array<Tool & { provider: 'TMDB' | 'OMDB' }> = [
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
];

// Build available tools based on configured API keys (prioritizes OMDB)
function getAvailableTools(): Tool[] {
  return ALL_TOOLS.filter((tool) => {
    if (tool.provider === "OMDB") return OMDB_AVAILABLE;
    if (tool.provider === "TMDB") return TMDB_AVAILABLE;
    return false;
  }).map(({ provider, ...tool }) => tool);
}

// API Helper Functions (OMDB first as primary)
async function fetchFromOMDB(params: Record<string, string>): Promise<any> {
  if (!OMDB_API_KEY) {
    throw new Error(
      "OMDB API is not configured. Please set the OMDB_API_KEY environment variable. " +
      "Get your free API key at https://www.omdbapi.com/apikey.aspx"
    );
  }

  const searchParams = new URLSearchParams({
    ...params,
    apikey: OMDB_API_KEY,
  });

  const url = `${OMDB_BASE_URL}?${searchParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function fetchFromTMDB(endpoint: string): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error(
      "TMDB API is not configured. Please set the TMDB_API_KEY environment variable. " +
      "Get your free API key at https://www.themoviedb.org/settings/api"
    );
  }

  const url = `${TMDB_BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }api_key=${TMDB_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Tool Implementation Functions (OMDB tools first)
async function getMovieByIMDB(imdbId: string): Promise<string> {
  const data = await fetchFromOMDB({ i: imdbId, plot: "full" });

  if (data.Response === "False") {
    throw new Error(data.Error || "Movie not found");
  }

  return JSON.stringify(data, null, 2);
}

async function searchMovies(query: string, year?: number): Promise<string> {
  const endpoint = `/search/movie?query=${encodeURIComponent(query)}${
    year ? `&year=${year}` : ""
  }`;

  const data = await fetchFromTMDB(endpoint);

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

async function getMovieDetails(movieId: number): Promise<string> {
  const data: MovieDetails = await fetchFromTMDB(`/movie/${movieId}`);

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

async function getPopularMovies(page: number = 1): Promise<string> {
  const data = await fetchFromTMDB(`/movie/popular?page=${page}`);

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

async function analyzeMoviePerformance(movieId: number): Promise<string> {
  const data: MovieDetails = await fetchFromTMDB(`/movie/${movieId}`);

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

async function searchTVShows(query: string, year?: number): Promise<string> {
  const endpoint = `/search/tv?query=${encodeURIComponent(query)}${
    year ? `&first_air_date_year=${year}` : ""
  }`;

  const data = await fetchFromTMDB(endpoint);

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

async function getTVShowDetails(tvId: number): Promise<string> {
  const data: TVShowDetails = await fetchFromTMDB(`/tv/${tvId}`);

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

async function getTVEpisodeDetails(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<string> {
  const data: TVEpisodeDetails = await fetchFromTMDB(
    `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`
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

// Create and configure the server
const server = new Server(
  {
    name: "movie-metadata-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: getAvailableTools() };
});

// Handle tool execution (OMDB tools handled first)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_movie_by_imdb": {
        const { imdb_id } = args as { imdb_id: string };
        const result = await getMovieByIMDB(imdb_id);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "search_movies": {
        const { query, year } = args as { query: string; year?: number };
        const result = await searchMovies(query, year);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_movie_details": {
        const { movie_id } = args as { movie_id: number };
        const result = await getMovieDetails(movie_id);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_popular_movies": {
        const { page } = args as { page?: number };
        const result = await getPopularMovies(page || 1);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "analyze_movie_performance": {
        const { movie_id } = args as { movie_id: number };
        const result = await analyzeMoviePerformance(movie_id);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "search_tv_shows": {
        const { query, year } = args as { query: string; year?: number };
        const result = await searchTVShows(query, year);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_tv_show_details": {
        const { tv_id } = args as { tv_id: number };
        const result = await getTVShowDetails(tv_id);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_tv_episode_details": {
        const { tv_id, season_number, episode_number } = args as {
          tv_id: number;
          season_number: number;
          episode_number: number;
        };
        const result = await getTVEpisodeDetails(tv_id, season_number, episode_number);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr since stdout is used for MCP communication
  console.error("Movie Metadata MCP Server running on stdio");
  console.error("─".repeat(50));

  // Log provider status (OMDB shown first as primary)
  console.error("Provider Status:");
  console.error(`  OMDB: ${OMDB_AVAILABLE ? "✓ Configured" : "✗ Not configured (set OMDB_API_KEY)"}`);
  console.error(`  TMDB: ${TMDB_AVAILABLE ? "✓ Configured" : "✗ Not configured (set TMDB_API_KEY)"}`);

  // Warn if no providers are configured
  if (!OMDB_AVAILABLE && !TMDB_AVAILABLE) {
    console.error("\n⚠ WARNING: No API providers configured!");
    console.error("  Please set at least one API key:");
    console.error("  - OMDB_API_KEY: https://www.omdbapi.com/apikey.aspx");
    console.error("  - TMDB_API_KEY: https://www.themoviedb.org/settings/api");
  }

  // Log available tools
  const availableTools = getAvailableTools();
  console.error(`\nAvailable Tools: ${availableTools.length}`);
  availableTools.forEach(tool => {
    console.error(`  - ${tool.name}`);
  });
  console.error("─".repeat(50));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
