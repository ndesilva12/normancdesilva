import { NextResponse } from "next/server";

export interface TrendingSearch {
  title: string;
  searchUrl: string;
}

export async function GET() {
  try {
    // Method 1: Try rss2json proxy service for Google Trends RSS
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
      "https://trends.google.com/trending/rss?geo=US"
    )}`;

    const proxyResponse = await fetch(rss2jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Dashboard/1.0)",
      },
      next: { revalidate: 300 },
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      if (data.status === "ok" && data.items && data.items.length > 0) {
        const trends: TrendingSearch[] = data.items.slice(0, 10).map((item: { title: string }) => ({
          title: item.title,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
        }));
        return NextResponse.json({ trends, source: "rss2json" });
      }
    }

    // Method 2: Try direct RSS fetch with different headers
    const rssUrl = "https://trends.google.com/trending/rss?geo=US";
    const directResponse = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 300 },
    });

    if (directResponse.ok) {
      const text = await directResponse.text();
      const trends: TrendingSearch[] = [];

      // Parse RSS XML - try CDATA format first
      let titleMatches = text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
      let count = 0;
      for (const match of titleMatches) {
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

      // If no CDATA format, try plain title tags
      if (trends.length === 0) {
        titleMatches = text.matchAll(/<title>([^<]+)<\/title>/g);
        count = 0;
        for (const match of titleMatches) {
          if (count > 0 && count <= 10) {
            const title = match[1].trim();
            if (title && !title.includes("Daily Search Trends")) {
              trends.push({
                title,
                searchUrl: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
              });
            }
          }
          count++;
        }
      }

      if (trends.length > 0) {
        return NextResponse.json({ trends, source: "google-rss" });
      }
    }

    // Method 3: Try the daily trends API endpoint
    const dailyUrl = "https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-300&geo=US&ns=15";
    const dailyResponse = await fetch(dailyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
      },
      next: { revalidate: 300 },
    });

    if (dailyResponse.ok) {
      let text = await dailyResponse.text();
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

    // Return empty array instead of error - UI will just not show trends
    return NextResponse.json({ trends: [], source: "none" });
  } catch (error) {
    console.error("Error fetching Google Trends:", error);
    return NextResponse.json({ trends: [], source: "error" });
  }
}
