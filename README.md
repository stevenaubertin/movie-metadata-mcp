# Movie Metadata MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

A Model Context Protocol (MCP) server that provides tools for fetching and analyzing movie metadata from TMDB (The Movie Database) and OMDB (Open Movie Database) APIs.

## Features

This MCP server provides eight powerful tools for movie and TV show data:

### Movie Tools
1. **get_movie_by_imdb** - Fetch movie data using IMDB ID via OMDB API (Primary)
2. **search_movies** - Search for movies by title with optional year filtering
3. **get_movie_details** - Get comprehensive movie information using TMDB ID
4. **get_popular_movies** - Discover currently trending movies
5. **analyze_movie_performance** - Analyze movie performance metrics (ROI, ratings, popularity)

### TV Show Tools
6. **search_tv_shows** - Search for TV shows by name with optional year filtering
7. **get_tv_show_details** - Get comprehensive TV show information using TMDB ID
8. **get_tv_episode_details** - Get specific episode information (name, air date, overview)

## Prerequisites

- Node.js 18 or higher
- OMDB API key (free at https://www.omdbapi.com/apikey.aspx) - Primary provider
- TMDB API key (free at https://www.themoviedb.org/settings/api) - Secondary provider

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/stevenaubertin/movie-metadata-mcp.git
   cd movie-metadata-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### API Keys

The server supports two API providers and works with either one or both configured:

- **OMDB_API_KEY** (Primary) - Get your free API key from [OMDB](https://www.omdbapi.com/apikey.aspx)
  - Enables: `get_movie_by_imdb`
- **TMDB_API_KEY** (Secondary) - Get your free API key from [TMDB](https://www.themoviedb.org/settings/api)
  - Enables: `search_movies`, `get_movie_details`, `get_popular_movies`, `analyze_movie_performance`, `search_tv_shows`, `get_tv_show_details`, `get_tv_episode_details`

**Note**: At least one API key is recommended, but the server will start successfully with neither (showing a warning). Only tools for configured providers will be available.

### Claude Desktop Configuration

Add this server to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "movie-metadata": {
      "command": "node",
      "args": ["C:\\Users\\x0r\\repo\\movie-metadata-mcp\\dist\\index.js"],
      "env": {
        "TMDB_API_KEY": "your_tmdb_api_key_here",
        "OMDB_API_KEY": "your_omdb_api_key_here"
      }
    }
  }
}
```

**Important**: Replace the path in `args` with the absolute path to your built `index.js` file and add your actual API keys.

## Usage Examples

Once configured with Claude Desktop, you can ask Claude to use these tools:

### Search for Movies
```
"Search for movies with 'Inception' in the title"
"Find movies named 'The Matrix' released in 1999"
```

### Get Movie Details
```
"Get detailed information about the movie with TMDB ID 27205"
"What are the production companies for movie ID 550?"
```

### Analyze Movie Performance
```
"Analyze the financial performance of The Shawshank Redemption (movie ID 278)"
"Show me the ROI and ratings for movie ID 155"
```

### Get Popular Movies
```
"What are the popular movies right now?"
"Show me page 2 of popular movies"
```

### Get Movie by IMDB ID
```
"Get information about movie with IMDB ID tt0111161"
"Look up tt0468569 on IMDB"
```

### Search for TV Shows
```
"Search for TV shows with 'Breaking Bad' in the title"
"Find TV shows named 'The Office' that started in 2005"
```

### Get TV Show Details
```
"Get detailed information about the TV show with TMDB ID 1396"
"How many seasons does TV show ID 1668 have?"
```

### Get TV Episode Details
```
"Get details for Breaking Bad season 5 episode 14"
"What is the name of episode 1 of season 1 for TV show ID 1396?"
```

## Available Tools

### get_movie_by_imdb (Primary - OMDB)
- **Parameters**:
  - `imdb_id` (required): IMDB ID (e.g., "tt0111161")
- **Returns**: Movie information from OMDB including ratings from multiple sources

### search_movies (TMDB)
- **Parameters**:
  - `query` (required): Movie title to search for
  - `year` (optional): Release year filter
- **Returns**: List of matching movies with IDs, titles, ratings, and overviews

### get_movie_details (TMDB)
- **Parameters**:
  - `movie_id` (required): TMDB movie ID
- **Returns**: Comprehensive movie data including budget, revenue, genres, runtime, production companies

### get_popular_movies (TMDB)
- **Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
- **Returns**: List of currently popular movies

### analyze_movie_performance (TMDB)
- **Parameters**:
  - `movie_id` (required): TMDB movie ID
- **Returns**: Financial analysis (ROI, profit), audience reception metrics, production info

### search_tv_shows (TMDB)
- **Parameters**:
  - `query` (required): TV show name to search for
  - `year` (optional): First air year filter
- **Returns**: List of matching TV shows with IDs, names, ratings, and overviews

### get_tv_show_details (TMDB)
- **Parameters**:
  - `tv_id` (required): TMDB TV show ID
- **Returns**: Comprehensive TV show data including number of seasons/episodes, genres, air dates, status

### get_tv_episode_details (TMDB)
- **Parameters**:
  - `tv_id` (required): TMDB TV show ID
  - `season_number` (required): Season number
  - `episode_number` (required): Episode number
- **Returns**: Episode details including name, air date, overview, runtime, and ratings

## Docker Deployment

Docker provides the easiest way to run this MCP server without needing to install Node.js or manage dependencies locally.

### Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Your API keys from TMDB and/or OMDB

### Quick Start with Docker

**Step 1: Get your API keys**

- **TMDB API Key**: Sign up at [TMDB](https://www.themoviedb.org/settings/api) (free, instant approval)
- **OMDB API Key**: Sign up at [OMDB](https://www.omdbapi.com/apikey.aspx) (free, email activation)

**Step 2: Clone and navigate to the repository**

```bash
git clone https://github.com/stevenaubertin/movie-metadata-mcp.git
cd movie-metadata-mcp
```

**Step 3: Set up environment variables**

Copy the example environment file and add your API keys:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and replace with your actual API keys
# TMDB_API_KEY=your_actual_tmdb_key_here
# OMDB_API_KEY=your_actual_omdb_key_here
```

**Step 4: Build the Docker image**

```bash
docker build -t movie-metadata-mcp .
```

This creates a lightweight Docker image (~50MB) with the MCP server and all dependencies.

**Step 5: Test the server**

Run the container interactively to verify it works:

```bash
docker run -i --rm \
  -e TMDB_API_KEY=your_tmdb_api_key \
  -e OMDB_API_KEY=your_omdb_api_key \
  movie-metadata-mcp
```

You should see output showing:
- Server running on stdio
- Provider status (TMDB and OMDB configured)
- Available tools list

Press `Ctrl+C` to stop.

### Using Docker Compose (Recommended)

Docker Compose simplifies running the container with environment variables from your `.env` file.

**Step 1: Ensure your `.env` file is configured** (see Quick Start above)

**Step 2: Start the service**

```bash
docker-compose up -d
```

**Step 3: Check the logs to verify it's running**

```bash
docker-compose logs -f
```

You should see the server startup messages and provider status.

**Step 4: Stop the service when needed**

```bash
docker-compose down
```

### Integrating with Claude Desktop (Docker)

To use the Dockerized MCP server with Claude Desktop, you need to configure Claude to run the Docker container.

**Step 1: Locate your Claude Desktop configuration file**

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Step 2: Build the Docker image first**

```bash
docker build -t movie-metadata-mcp .
```

**Step 3: Add the server configuration**

Edit your `claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "movie-metadata": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "TMDB_API_KEY=your_actual_tmdb_api_key_here",
        "-e", "OMDB_API_KEY=your_actual_omdb_api_key_here",
        "movie-metadata-mcp"
      ]
    }
  }
}
```

**Important**:
- Replace `your_actual_tmdb_api_key_here` and `your_actual_omdb_api_key_here` with your real API keys
- The `--rm` flag ensures containers are cleaned up after use
- The `-i` flag keeps stdin open for MCP communication

**Step 4: Restart Claude Desktop**

Close and reopen Claude Desktop to load the new configuration.

**Step 5: Verify the server is available**

In Claude Desktop, you should be able to ask Claude to use the movie metadata tools, such as:
- "Search for movies about space exploration"
- "Get details for movie ID 550 (Fight Club)"
- "What are the popular movies right now?"

### Docker Tips

**View available tools when server starts:**

The server logs show which providers are configured and which tools are available:

```
Movie Metadata MCP Server running on stdio
──────────────────────────────────────────────────
Provider Status:
  OMDB: ✓ Configured
  TMDB: ✓ Configured

Available Tools: 5
  - get_movie_by_imdb
  - search_movies
  - get_movie_details
  - get_popular_movies
  - analyze_movie_performance
──────────────────────────────────────────────────
```

**Run with only one API provider:**

You can run with just OMDB or just TMDB:

```bash
# Only OMDB - Primary provider (1 tool available)
docker run -i --rm \
  -e OMDB_API_KEY=your_omdb_api_key \
  movie-metadata-mcp

# Only TMDB - Secondary provider (4 tools available)
docker run -i --rm \
  -e TMDB_API_KEY=your_tmdb_api_key \
  movie-metadata-mcp
```

**Rebuild after code changes:**

If you modify the source code, rebuild the image:

```bash
docker build -t movie-metadata-mcp .
```

**Remove old images:**

Clean up old images to save space:

```bash
docker image prune -f
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev

# Run directly
npm start
```

## Graceful Degradation

The MCP server is designed to work with partial configuration:

- **Both APIs configured**: All 8 tools available
- **Only OMDB configured** (Primary): 1 tool available (get_movie_by_imdb)
- **Only TMDB configured** (Secondary): 7 tools available (search movies/TV shows, details, popular, analyze, episodes)
- **No APIs configured**: Server starts with warning, 0 tools available

The server logs provider status on startup to stderr, showing which APIs are configured and which tools are available. OMDB is listed first as the primary provider.

## API Rate Limits

- **TMDB**: Free tier allows 40 requests per 10 seconds
- **OMDB**: Free tier allows 1,000 requests per day

## License

MIT

## Repository

**GitHub**: [https://github.com/stevenaubertin/movie-metadata-mcp](https://github.com/stevenaubertin/movie-metadata-mcp)

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

**Steven Aubertin**
- GitHub: [@stevenaubertin](https://github.com/stevenaubertin)
