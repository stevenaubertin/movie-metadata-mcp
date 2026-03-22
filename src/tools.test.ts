import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ALL_TOOLS,
  getAvailableTools,
  fetchFromOMDB,
  fetchFromTMDB,
  getMovieByIMDB,
  searchMovies,
  getMovieDetails,
  getPopularMovies,
  analyzeMoviePerformance,
  searchTVShows,
  getTVShowDetails,
  getTVEpisodeDetails,
} from "./tools.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function mockJsonResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Not Found",
    json: () => Promise.resolve(data),
  };
}

// ─── ALL_TOOLS ───────────────────────────────────────────────────────

describe("ALL_TOOLS", () => {
  it("should have 8 tools defined", () => {
    expect(ALL_TOOLS).toHaveLength(8);
  });

  it("should have OMDB tools listed before TMDB tools", () => {
    const omdbIndex = ALL_TOOLS.findIndex((t) => t.provider === "OMDB");
    const firstTmdbIndex = ALL_TOOLS.findIndex((t) => t.provider === "TMDB");
    expect(omdbIndex).toBeLessThan(firstTmdbIndex);
  });

  it("should have exactly 1 OMDB tool and 7 TMDB tools", () => {
    const omdb = ALL_TOOLS.filter((t) => t.provider === "OMDB");
    const tmdb = ALL_TOOLS.filter((t) => t.provider === "TMDB");
    expect(omdb).toHaveLength(1);
    expect(tmdb).toHaveLength(7);
  });

  it("should have unique tool names", () => {
    const names = ALL_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("should use snake_case for all tool names", () => {
    ALL_TOOLS.forEach((tool) => {
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
    });
  });

  it("should have inputSchema with type object for all tools", () => {
    ALL_TOOLS.forEach((tool) => {
      expect(tool.inputSchema.type).toBe("object");
    });
  });
});

// ─── getAvailableTools ───────────────────────────────────────────────

describe("getAvailableTools", () => {
  it("should return no tools when no API keys are configured", () => {
    const tools = getAvailableTools(false, false);
    expect(tools).toHaveLength(0);
  });

  it("should return only OMDB tools when only OMDB is configured", () => {
    const tools = getAvailableTools(true, false);
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("get_movie_by_imdb");
  });

  it("should return only TMDB tools when only TMDB is configured", () => {
    const tools = getAvailableTools(false, true);
    expect(tools).toHaveLength(7);
    tools.forEach((tool) => {
      expect(tool.name).not.toBe("get_movie_by_imdb");
    });
  });

  it("should return all 8 tools when both APIs are configured", () => {
    const tools = getAvailableTools(true, true);
    expect(tools).toHaveLength(8);
  });

  it("should strip the provider field from returned tools", () => {
    const tools = getAvailableTools(true, true);
    tools.forEach((tool) => {
      expect(tool).not.toHaveProperty("provider");
    });
  });
});

// ─── fetchFromOMDB ──────────────────────────────────────────────────

describe("fetchFromOMDB", () => {
  it("should throw when apiKey is empty", async () => {
    await expect(fetchFromOMDB({ i: "tt0111161" }, "")).rejects.toThrow(
      "OMDB API is not configured"
    );
  });

  it("should make a request with correct URL parameters", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ Title: "Test" }));
    await fetchFromOMDB({ i: "tt0111161", plot: "full" }, "testkey");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("apikey=testkey");
    expect(calledUrl).toContain("i=tt0111161");
    expect(calledUrl).toContain("plot=full");
  });

  it("should use the provided base URL", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ Title: "Test" }));
    await fetchFromOMDB({ i: "tt0111161" }, "key", "https://custom.api.com");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl.startsWith("https://custom.api.com")).toBe(true);
  });

  it("should throw on non-200 response", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({}, false, 500));
    await expect(fetchFromOMDB({ i: "tt0111161" }, "key")).rejects.toThrow(
      "OMDB API error: 500"
    );
  });

  it("should return parsed JSON on success", async () => {
    const data = { Title: "The Matrix", Year: "1999" };
    mockFetch.mockResolvedValueOnce(mockJsonResponse(data));
    const result = await fetchFromOMDB({ i: "tt0133093" }, "key");
    expect(result).toEqual(data);
  });
});

// ─── fetchFromTMDB ──────────────────────────────────────────────────

describe("fetchFromTMDB", () => {
  it("should throw when apiKey is empty", async () => {
    await expect(fetchFromTMDB("/movie/123", "")).rejects.toThrow(
      "TMDB API is not configured"
    );
  });

  it("should append api_key with ? when endpoint has no query params", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
    await fetchFromTMDB("/movie/123", "tmdbkey");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("?api_key=tmdbkey");
  });

  it("should append api_key with & when endpoint already has query params", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
    await fetchFromTMDB("/search/movie?query=test", "tmdbkey");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("&api_key=tmdbkey");
  });

  it("should throw on non-200 response", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({}, false, 404));
    await expect(fetchFromTMDB("/movie/999", "key")).rejects.toThrow(
      "TMDB API error: 404"
    );
  });
});

// ─── getMovieByIMDB ─────────────────────────────────────────────────

describe("getMovieByIMDB", () => {
  it("should return stringified movie data on success", async () => {
    const movieData = {
      Title: "The Shawshank Redemption",
      Year: "1994",
      Response: "True",
    };
    mockFetch.mockResolvedValueOnce(mockJsonResponse(movieData));

    const result = await getMovieByIMDB("tt0111161", "key");
    const parsed = JSON.parse(result);
    expect(parsed.Title).toBe("The Shawshank Redemption");
  });

  it("should throw when OMDB returns Response: False", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ Response: "False", Error: "Movie not found!" })
    );

    await expect(getMovieByIMDB("tt0000000", "key")).rejects.toThrow(
      "Movie not found!"
    );
  });

  it("should throw generic error when OMDB returns False without message", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ Response: "False" })
    );

    await expect(getMovieByIMDB("tt0000000", "key")).rejects.toThrow(
      "Movie not found"
    );
  });
});

// ─── searchMovies ───────────────────────────────────────────────────

describe("searchMovies", () => {
  const mockResults = {
    total_results: 2,
    results: [
      {
        id: 1,
        title: "Movie A",
        release_date: "2020-01-01",
        overview: "A movie",
        vote_average: 7.5,
        popularity: 100,
      },
      {
        id: 2,
        title: "Movie B",
        release_date: "2021-02-02",
        overview: "B movie",
        vote_average: 6.0,
        popularity: 50,
      },
    ],
  };

  it("should return formatted search results", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockResults));

    const result = await searchMovies("test", "key");
    const parsed = JSON.parse(result);
    expect(parsed.total_results).toBe(2);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].title).toBe("Movie A");
  });

  it("should include year in the endpoint when provided", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockResults));
    await searchMovies("test", "key", 2020);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("year=2020");
  });

  it("should limit results to 10", async () => {
    const manyResults = {
      total_results: 15,
      results: Array.from({ length: 15 }, (_, i) => ({
        id: i,
        title: `Movie ${i}`,
        release_date: "2020-01-01",
        overview: "",
        vote_average: 5,
        popularity: 10,
      })),
    };
    mockFetch.mockResolvedValueOnce(mockJsonResponse(manyResults));

    const result = await searchMovies("test", "key");
    const parsed = JSON.parse(result);
    expect(parsed.results).toHaveLength(10);
  });
});

// ─── getMovieDetails ────────────────────────────────────────────────

describe("getMovieDetails", () => {
  const mockMovie = {
    id: 550,
    title: "Fight Club",
    tagline: "Mischief. Mayhem. Soap.",
    release_date: "1999-10-15",
    runtime: 139,
    genres: [{ id: 18, name: "Drama" }],
    overview: "An insomniac...",
    vote_average: 8.4,
    vote_count: 25000,
    budget: 63000000,
    revenue: 101200000,
    production_companies: [{ id: 1, name: "Fox" }],
  };

  it("should return formatted movie details", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockMovie));

    const result = await getMovieDetails(550, "key");
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe("Fight Club");
    expect(parsed.genres).toEqual(["Drama"]);
    expect(parsed.production_companies).toEqual(["Fox"]);
  });
});

// ─── getPopularMovies ───────────────────────────────────────────────

describe("getPopularMovies", () => {
  it("should return paginated popular movies", async () => {
    const mockData = {
      page: 1,
      total_pages: 5,
      results: [
        {
          id: 1,
          title: "Popular Movie",
          release_date: "2024-01-01",
          vote_average: 8.0,
          popularity: 500,
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockData));

    const result = await getPopularMovies("key", 1);
    const parsed = JSON.parse(result);
    expect(parsed.page).toBe(1);
    expect(parsed.total_pages).toBe(5);
    expect(parsed.results[0].title).toBe("Popular Movie");
  });
});

// ─── analyzeMoviePerformance ────────────────────────────────────────

describe("analyzeMoviePerformance", () => {
  function makeMockMovie(overrides: Partial<Record<string, any>> = {}) {
    return {
      id: 1,
      title: "Test Movie",
      release_date: "2020-01-01",
      runtime: 120,
      genres: [{ id: 1, name: "Action" }],
      overview: "Test",
      vote_average: 7.5,
      vote_count: 1000,
      budget: 100000000,
      revenue: 300000000,
      production_companies: [{ id: 1, name: "Studio" }],
      tagline: "Test tagline",
      ...overrides,
    };
  }

  it("should classify a highly profitable movie", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ budget: 100000000, revenue: 300000000 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.financial_performance.status).toBe("Highly Profitable");
    expect(parseFloat(parsed.financial_performance.roi_percentage)).toBe(200);
  });

  it("should classify a profitable movie (ROI > 0 but <= 100)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ budget: 100000000, revenue: 150000000 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.financial_performance.status).toBe("Profitable");
  });

  it("should classify a movie at a loss", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ budget: 100000000, revenue: 50000000 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.financial_performance.status).toBe("Loss");
  });

  it("should classify break even when budget is 0", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ budget: 0, revenue: 0 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.financial_performance.status).toBe("Break Even or Unknown");
  });

  it("should classify Excellent rating for vote_average >= 8", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ vote_average: 8.5 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.audience_reception.rating_category).toBe("Excellent");
  });

  it("should classify Good rating for vote_average >= 7 and < 8", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ vote_average: 7.5 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.audience_reception.rating_category).toBe("Good");
  });

  it("should classify Average rating for vote_average >= 6 and < 7", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ vote_average: 6.5 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.audience_reception.rating_category).toBe("Average");
  });

  it("should classify Below Average rating for vote_average < 6", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(makeMockMovie({ vote_average: 4.0 }))
    );

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.audience_reception.rating_category).toBe("Below Average");
  });

  it("should include production info", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(makeMockMovie()));

    const result = await analyzeMoviePerformance(1, "key");
    const parsed = JSON.parse(result);
    expect(parsed.production_info.runtime_minutes).toBe(120);
    expect(parsed.production_info.genres).toEqual(["Action"]);
    expect(parsed.production_info.production_companies).toEqual(["Studio"]);
  });
});

// ─── searchTVShows ──────────────────────────────────────────────────

describe("searchTVShows", () => {
  const mockResults = {
    total_results: 1,
    results: [
      {
        id: 1,
        name: "Breaking Bad",
        first_air_date: "2008-01-20",
        overview: "A chemistry teacher...",
        vote_average: 8.9,
        popularity: 200,
      },
    ],
  };

  it("should return formatted TV show search results", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockResults));

    const result = await searchTVShows("breaking", "key");
    const parsed = JSON.parse(result);
    expect(parsed.results[0].name).toBe("Breaking Bad");
  });

  it("should include year filter when provided", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockResults));
    await searchTVShows("breaking", "key", 2008);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("first_air_date_year=2008");
  });
});

// ─── getTVShowDetails ───────────────────────────────────────────────

describe("getTVShowDetails", () => {
  it("should return formatted TV show details", async () => {
    const mockShow = {
      id: 1396,
      name: "Breaking Bad",
      first_air_date: "2008-01-20",
      last_air_date: "2013-09-29",
      number_of_seasons: 5,
      number_of_episodes: 62,
      genres: [{ id: 18, name: "Drama" }],
      overview: "A chemistry teacher...",
      vote_average: 8.9,
      vote_count: 10000,
      status: "Ended",
      tagline: "Say my name",
    };
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockShow));

    const result = await getTVShowDetails(1396, "key");
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Breaking Bad");
    expect(parsed.number_of_seasons).toBe(5);
    expect(parsed.genres).toEqual(["Drama"]);
    expect(parsed.status).toBe("Ended");
  });
});

// ─── getTVEpisodeDetails ────────────────────────────────────────────

describe("getTVEpisodeDetails", () => {
  it("should return formatted episode details", async () => {
    const mockEpisode = {
      id: 62085,
      name: "Ozymandias",
      episode_number: 14,
      season_number: 5,
      air_date: "2013-09-15",
      overview: "Everyone copes...",
      vote_average: 9.8,
      runtime: 47,
    };
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockEpisode));

    const result = await getTVEpisodeDetails(1396, 5, 14, "key");
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Ozymandias");
    expect(parsed.episode_number).toBe(14);
    expect(parsed.season_number).toBe(5);
    expect(parsed.runtime).toBe(47);
  });

  it("should call TMDB with correct endpoint", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        id: 1,
        name: "Pilot",
        episode_number: 1,
        season_number: 1,
        air_date: "2020-01-01",
        overview: "First episode",
        vote_average: 7.0,
        runtime: 45,
      })
    );

    await getTVEpisodeDetails(100, 2, 3, "key");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/tv/100/season/2/episode/3");
  });
});
