#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  getAvailableTools,
  getMovieByIMDB,
  searchMovies,
  getMovieDetails,
  getPopularMovies,
  analyzeMoviePerformance,
  searchTVShows,
  getTVShowDetails,
  getTVEpisodeDetails,
  getWatchProviders,
} from "./tools.js";

// OMDB API Configuration (Primary)
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_AVAILABLE = !!OMDB_API_KEY;

// TMDB API Configuration (Secondary)
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_AVAILABLE = !!TMDB_API_KEY;

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
  return { tools: getAvailableTools(OMDB_AVAILABLE, TMDB_AVAILABLE) };
});

// Handle tool execution (OMDB tools handled first)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_movie_by_imdb": {
        const { imdb_id } = args as { imdb_id: string };
        const result = await getMovieByIMDB(imdb_id, OMDB_API_KEY!);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "search_movies": {
        const { query, year } = args as { query: string; year?: number };
        const result = await searchMovies(query, TMDB_API_KEY!, year);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_movie_details": {
        const { movie_id } = args as { movie_id: number };
        const result = await getMovieDetails(movie_id, TMDB_API_KEY!);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_popular_movies": {
        const { page } = args as { page?: number };
        const result = await getPopularMovies(TMDB_API_KEY!, page || 1);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "analyze_movie_performance": {
        const { movie_id } = args as { movie_id: number };
        const result = await analyzeMoviePerformance(movie_id, TMDB_API_KEY!);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "search_tv_shows": {
        const { query, year } = args as { query: string; year?: number };
        const result = await searchTVShows(query, TMDB_API_KEY!, year);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_tv_show_details": {
        const { tv_id } = args as { tv_id: number };
        const result = await getTVShowDetails(tv_id, TMDB_API_KEY!);
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
        const result = await getTVEpisodeDetails(tv_id, season_number, episode_number, TMDB_API_KEY!);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_watch_providers": {
        const target = args as {
          movie_id?: number;
          imdb_id?: string;
          region?: string;
          media_type?: "movie" | "tv";
        };
        const result = await getWatchProviders(target, TMDB_API_KEY!);
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
  const availableTools = getAvailableTools(OMDB_AVAILABLE, TMDB_AVAILABLE);
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
