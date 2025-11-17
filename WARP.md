# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides movie metadata tools for Claude Desktop. It integrates with OMDB (primary) and TMDB (secondary) APIs to search movies, fetch details, and analyze performance metrics.

**Repository**: https://github.com/stevenaubertin/movie-metadata-mcp

## Architecture

### Core Components

- **Single-file architecture**: All server logic is in `src/index.ts`
- **MCP SDK integration**: Uses `@modelcontextprotocol/sdk` for server/transport functionality
- **API abstraction**: Two helper functions (`fetchFromOMDB`, `fetchFromTMDB`) handle all external API calls
- **Tool-based architecture**: Five tools defined in `ALL_TOOLS` array, dispatched via switch statement in request handler
- **Graceful degradation**: Server dynamically enables tools based on configured API keys
- **Docker support**: Fully containerized with Dockerfile and docker-compose.yml

### Key Patterns

1. **Environment-based configuration**: API keys loaded from `process.env.OMDB_API_KEY` (primary) and `process.env.TMDB_API_KEY` (secondary)
2. **Provider prioritization**: OMDB is listed first throughout codebase and documentation as primary provider
3. **Dynamic tool filtering**: `getAvailableTools()` function filters tools based on available API keys
4. **Stdio transport**: Server communicates via stdin/stdout (required for MCP protocol)
5. **JSON Schema validation**: Each tool has an `inputSchema` defining required/optional parameters
6. **Structured responses**: All tools return JSON-stringified data for consistent parsing
7. **Startup logging**: Server logs provider status and available tools to stderr on startup

## Development Commands

### Local Development (Node.js)

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch mode (rebuilds on file changes)
npm run dev

# Run the built server
npm start
```

### Docker Development

```bash
# Build Docker image
docker build -t movie-metadata-mcp .

# Run container with API keys
docker run -i --rm \
  -e OMDB_API_KEY=your_omdb_key \
  -e TMDB_API_KEY=your_tmdb_key \
  movie-metadata-mcp

# Using Docker Compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Testing with Claude Desktop

**Option 1: Node.js (Development)**

Configure in Claude Desktop config file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "movie-metadata": {
      "command": "node",
      "args": ["/absolute/path/to/movie-metadata-mcp/dist/index.js"],
      "env": {
        "OMDB_API_KEY": "your_omdb_key_here",
        "TMDB_API_KEY": "your_tmdb_key_here"
      }
    }
  }
}
```

**Option 2: Docker (Production)**

```json
{
  "mcpServers": {
    "movie-metadata": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "OMDB_API_KEY=your_omdb_key_here",
        "-e", "TMDB_API_KEY=your_tmdb_key_here",
        "movie-metadata-mcp"
      ]
    }
  }
}
```

Restart Claude Desktop to load changes.

## Code Structure

### Available Tools (in priority order)

1. **get_movie_by_imdb** (OMDB - Primary)
2. **search_movies** (TMDB)
3. **get_movie_details** (TMDB)
4. **get_popular_movies** (TMDB)
5. **analyze_movie_performance** (TMDB)

### Adding New Tools

1. Define tool schema in `ALL_TOOLS` array with:
   - `name`: Tool identifier
   - `description`: What the tool does
   - `inputSchema`: JSON schema for parameters
   - `provider`: Either "OMDB" or "TMDB"
2. Implement tool function (follow pattern: `async function toolName(...): Promise<string>`)
3. Add case to switch statement in `CallToolRequestSchema` handler
4. Tool functions should return JSON-stringified results for consistency
5. Place OMDB tools before TMDB tools to maintain priority order

### API Integration

- **OMDB** (Primary): Uses query parameters including `apikey`
  - Returns `{"Response": "False", "Error": "..."}` on failure
  - Helper function: `fetchFromOMDB(params: Record<string, string>)`
- **TMDB** (Secondary): Uses REST endpoints with API key as query parameter
  - Helper function: `fetchFromTMDB(endpoint: string)`
- Both APIs throw errors on non-200 responses
- All API helpers check for configured keys before making requests

### TypeScript Configuration

- **Target**: ES2022
- **Module system**: Node16 (ESM with `.js` extensions in imports)
- **Output**: `dist/` directory
- **Strict mode**: Enabled

## Important Constraints

### API Rate Limits
- TMDB: 40 requests per 10 seconds
- OMDB: 1,000 requests per day

### Communication Protocol
- **Never log to stdout**: MCP uses stdout for protocol messages
- **Use stderr for logging**: `console.error()` for debug/startup messages
- **Return structured data**: All tool responses must be valid JSON

### Environment Requirements
- Node.js 18+ (or Docker)
- At least one API key recommended:
  - **OMDB API key** (Primary): Enables `get_movie_by_imdb` tool
  - **TMDB API key** (Secondary): Enables 4 tools (search, details, popular, analyze)
- Server starts with warning if no API keys configured (0 tools available)

## Docker Deployment

### Dockerfile Details

- **Base image**: `node:25-alpine` (lightweight, ~50MB final image)
- **Build process**:
  1. Copy package files and source
  2. Run `npm ci` (uses prepare script which runs build)
  3. Clean up source files to reduce image size
- **Environment**: Production mode by default
- **Runtime**: Expects `OMDB_API_KEY` and/or `TMDB_API_KEY` environment variables

### Docker Compose

- Uses `.env` file for API keys
- Enables stdin/tty for MCP communication
- Auto-restart policy: `unless-stopped`
- No port exposure (stdio communication only)

## Common Tasks

### Modifying API Responses

Edit the transformation logic in tool implementation functions (e.g., `getMovieByIMDB`, `searchMovies`, `getMovieDetails`). These map API responses to simplified JSON structures.

### Changing API Endpoints

- **OMDB**: Modify parameters passed to `fetchFromOMDB()`
- **TMDB**: Modify endpoint strings passed to `fetchFromTMDB()`

### Adding Provider Priority

When adding new tools, ensure OMDB tools are:
1. Listed first in `ALL_TOOLS` array
2. Checked first in `getAvailableTools()` filter
3. Placed first in switch statement cases
4. Documented before TMDB tools in README

### Error Handling

All tool execution is wrapped in try-catch. Errors return:
```typescript
{
  content: [{ type: "text", text: `Error: ${errorMessage}` }],
  isError: true
}
```

Unconfigured API errors provide helpful messages with links to get API keys.
