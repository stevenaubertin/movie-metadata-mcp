#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// TMDB API Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// OMDB API Configuration
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = "https://www.omdbapi.com";

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

// Define available tools
const TOOLS: Tool[] = [
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
  },
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
  },
];

// API Helper Functions
async function fetchFromTMDB(endpoint: string): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY environment variable is not set");
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

async function fetchFromOMDB(params: Record<string, string>): Promise<any> {
  if (!OMDB_API_KEY) {
    throw new Error("OMDB_API_KEY environment variable is not set");
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

// Tool Implementation Functions
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

async function getMovieByIMDB(imdbId: string): Promise<string> {
  const data = await fetchFromOMDB({ i: imdbId, plot: "full" });

  if (data.Response === "False") {
    throw new Error(data.Error || "Movie not found");
  }

  return JSON.stringify(data, null, 2);
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
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
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

      case "get_movie_by_imdb": {
        const { imdb_id } = args as { imdb_id: string };
        const result = await getMovieByIMDB(imdb_id);
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
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
