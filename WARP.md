# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides movie metadata tools for Claude Desktop. It integrates with TMDB and OMDB APIs to search movies, fetch details, and analyze performance metrics.

## Architecture

### Core Components

- **Single-file architecture**: All server logic is in `src/index.ts`
- **MCP SDK integration**: Uses `@modelcontextprotocol/sdk` for server/transport functionality
- **API abstraction**: Two helper functions (`fetchFromTMDB`, `fetchFromOMDB`) handle all external API calls
- **Tool-based architecture**: Five tools defined in `TOOLS` array, dispatched via switch statement in request handler

### Key Patterns

1. **Environment-based configuration**: API keys loaded from `process.env.TMDB_API_KEY` and `process.env.OMDB_API_KEY`
2. **Stdio transport**: Server communicates via stdin/stdout (required for MCP protocol)
3. **JSON Schema validation**: Each tool has an `inputSchema` defining required/optional parameters
4. **Structured responses**: All tools return JSON-stringified data for consistent parsing

## Development Commands

### Build and Run
```bash
# Build TypeScript to JavaScript
npm run build

# Watch mode (rebuilds on file changes)
npm run dev

# Run the built server
npm start
```

### Testing with Claude Desktop

After building, configure in Claude Desktop config file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add to config:
```json
{
  "mcpServers": {
    "movie-metadata": {
      "command": "node",
      "args": ["C:\\Users\\x0r\\repo\\movie-metadata-mcp\\dist\\index.js"],
      "env": {
        "TMDB_API_KEY": "your_key_here",
        "OMDB_API_KEY": "your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop to load changes.

## Code Structure

### Adding New Tools

1. Define tool schema in `TOOLS` array with name, description, and `inputSchema`
2. Implement tool function (follow pattern: `async function toolName(...): Promise<string>`)
3. Add case to switch statement in `CallToolRequestSchema` handler
4. Tool functions should return JSON-stringified results for consistency

### API Integration

- **TMDB**: Uses REST endpoints with API key as query parameter
- **OMDB**: Uses query parameters including `apikey`
- Both APIs throw errors on non-200 responses
- OMDB returns `{"Response": "False", "Error": "..."}` on failure

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
- Node.js 18+
- Valid TMDB API key (required)
- Valid OMDB API key (optional, only for `get_movie_by_imdb` tool)

## Common Tasks

### Modifying API Responses

Edit the transformation logic in tool implementation functions (e.g., `searchMovies`, `getMovieDetails`). These map API responses to simplified JSON structures.

### Changing API Endpoints

Modify the endpoint strings passed to `fetchFromTMDB()` or parameters passed to `fetchFromOMDB()`.

### Error Handling

All tool execution is wrapped in try-catch. Errors return:
```typescript
{
  content: [{ type: "text", text: `Error: ${errorMessage}` }],
  isError: true
}
```
