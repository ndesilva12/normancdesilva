import { NextResponse } from "next/server";

export interface TrendingSearch {
  title: string;
  searchUrl: string;
}

export async function GET() {
  try {
    // Try Google Trends RSS feed
    const rssUrl = "https://trends.google.com/trending/rss?geo=US";

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (response.ok) {
      const text = await response.text();

      // Parse RSS XML to extract titles
      const trends: TrendingSearch[] = [];
      const titleMatches = text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);

      let count = 0;
      for (const match of titleMatches) {
        // Skip the first title (feed title)
        if (count > 0 && count <= 10) {
          const title = match[1].trim();
          if (title) {
            trends.push({
              title,
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
            });
          }
        }
        count++;
      }

      if (trends.length > 0) {
        return NextResponse.json({ trends, source: "google-rss" });
      }
    }

    // Fallback: Try Google Trends daily API endpoint
    const dailyUrl = "https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-300&geo=US&ns=15";

    const dailyResponse = await fetch(dailyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 },
    });

    if (dailyResponse.ok) {
      let text = await dailyResponse.text();
      // Remove the )]}' prefix that Google adds
      if (text.startsWith(")]}'")) {
        text = text.substring(4);
      }

      try {
        const data = JSON.parse(text);
        const trends: TrendingSearch[] = [];

        const trendingSearches = data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

        for (const item of trendingSearches.slice(0, 10)) {
          const title = item?.title?.query;
          if (title) {
            trends.push({
              title,
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
            });
          }
        }

        if (trends.length > 0) {
          return NextResponse.json({ trends, source: "google-daily" });
        }
      } catch {
        // JSON parse failed
      }
    }

    // If all methods fail, return an error
    return NextResponse.json(
      { error: "Unable to fetch Google Trends. The service may be temporarily unavailable.", trends: [] },
      { status: 503 }
    );
  } catch (error) {
    console.error("Error fetching Google Trends:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trends", trends: [] },
      { status: 500 }
    );
  }
}
