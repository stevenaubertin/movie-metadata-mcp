# Movie Metadata MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

A Model Context Protocol (MCP) server that provides tools for fetching and analyzing movie metadata from TMDB (The Movie Database) and OMDB (Open Movie Database) APIs.

## Features

This MCP server provides five powerful tools for movie data:

1. **search_movies** - Search for movies by title with optional year filtering
2. **get_movie_details** - Get comprehensive movie information using TMDB ID
3. **get_movie_by_imdb** - Fetch movie data using IMDB ID via OMDB API
4. **get_popular_movies** - Discover currently trending movies
5. **analyze_movie_performance** - Analyze movie performance metrics (ROI, ratings, popularity)

## Prerequisites

- Node.js 18 or higher
- TMDB API key (free at https://www.themoviedb.org/settings/api)
- OMDB API key (optional, free at https://www.omdbapi.com/apikey.aspx)

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

- **TMDB_API_KEY** - Get your free API key from [TMDB](https://www.themoviedb.org/settings/api)
  - Enables: `search_movies`, `get_movie_details`, `get_popular_movies`, `analyze_movie_performance`
- **OMDB_API_KEY** - Get your free API key from [OMDB](https://www.omdbapi.com/apikey.aspx)
  - Enables: `get_movie_by_imdb`

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

## Available Tools

### search_movies
- **Parameters**: 
  - `query` (required): Movie title to search for
  - `year` (optional): Release year filter
- **Returns**: List of matching movies with IDs, titles, ratings, and overviews

### get_movie_details
- **Parameters**: 
  - `movie_id` (required): TMDB movie ID
- **Returns**: Comprehensive movie data including budget, revenue, genres, runtime, production companies

### get_movie_by_imdb
- **Parameters**: 
  - `imdb_id` (required): IMDB ID (e.g., "tt0111161")
- **Returns**: Movie information from OMDB including ratings from multiple sources

### get_popular_movies
- **Parameters**: 
  - `page` (optional): Page number for pagination (default: 1)
- **Returns**: List of currently popular movies

### analyze_movie_performance
- **Parameters**: 
  - `movie_id` (required): TMDB movie ID
- **Returns**: Financial analysis (ROI, profit), audience reception metrics, production info

## Docker Deployment

### Using Docker

The easiest way to run this MCP server is with Docker:

1. Create a `.env` file in the project root:
   ```bash
   TMDB_API_KEY=your_tmdb_api_key_here
   OMDB_API_KEY=your_omdb_api_key_here
   ```

2. Build the Docker image:
   ```bash
   docker build -t movie-metadata-mcp .
   ```

3. Run the container:
   ```bash
   docker run -i \
     -e TMDB_API_KEY=your_tmdb_api_key \
     -e OMDB_API_KEY=your_omdb_api_key \
     movie-metadata-mcp
   ```

### Using Docker Compose

For easier management, use Docker Compose:

1. Create a `.env` file in the project root with your API keys (see above)

2. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. View logs:
   ```bash
   docker-compose logs -f
   ```

4. Stop the service:
   ```bash
   docker-compose down
   ```

### Claude Desktop with Docker

To use the Dockerized MCP server with Claude Desktop, update your configuration:

```json
{
  "mcpServers": {
    "movie-metadata": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "TMDB_API_KEY=your_tmdb_api_key_here",
        "-e", "OMDB_API_KEY=your_omdb_api_key_here",
        "movie-metadata-mcp"
      ]
    }
  }
}
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

- **Both APIs configured**: All 5 tools available
- **Only TMDB configured**: 4 tools available (search, details, popular, analyze)
- **Only OMDB configured**: 1 tool available (get_movie_by_imdb)
- **No APIs configured**: Server starts with warning, 0 tools available

The server logs provider status on startup to stderr, showing which APIs are configured and which tools are available.

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
