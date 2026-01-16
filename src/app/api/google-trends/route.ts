import { NextResponse } from "next/server";

export interface TrendingSearch {
  title: string;
  searchUrl: string;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // Add timestamp for cache busting
  const timestamp = Date.now();

  try {
    // Method 1: Try the realtime trends API with cache busting
    const realtimeUrl = `https://trends.google.com/trends/api/realtimetrends?hl=en-US&tz=-300&cat=all&fi=0&fs=0&geo=US&ri=300&rs=20&sort=0&_=${timestamp}`;
    const realtimeResponse = await fetch(realtimeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://trends.google.com/trending?geo=US&hours=4",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
      cache: "no-store",
    });

    if (realtimeResponse.ok) {
      let text = await realtimeResponse.text();
      // Remove the XSSI protection prefix
      if (text.startsWith(")]}'")) {
        text = text.substring(4);
      }

      try {
        const data = JSON.parse(text);
        const trends: TrendingSearch[] = [];
        const stories = data?.storySummaries?.trendingStories || [];

        for (const story of stories.slice(0, 15)) {
          const title = story?.title || story?.entityNames?.[0];
          if (title && !trends.some((t) => t.title === title)) {
            trends.push({
              title,
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
            });
          }
        }

        if (trends.length > 0) {
          return NextResponse.json({
            trends,
            source: "google-realtime",
            timestamp: new Date().toISOString()
          });
        }
      } catch {
        // JSON parse failed, try next method
      }
    }

    // Method 2: Try the hottrends API
    const hottrendsUrl = `https://trends.google.com/trends/hottrends/visualize/internal/data?hl=en-US&tz=-300&geo=US&_=${timestamp}`;
    try {
      const hottrendsResponse = await fetch(hottrendsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json, text/plain, */*",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      if (hottrendsResponse.ok) {
        const data = await hottrendsResponse.json();
        if (data && data.united_states) {
          const trends: TrendingSearch[] = data.united_states.slice(0, 15).map((item: string) => ({
            title: item,
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item)}`,
          }));
          if (trends.length > 0) {
            return NextResponse.json({
              trends,
              source: "google-hottrends",
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch {
      // hottrends failed, continue
    }

    // Method 3: Try the daily trends API with different date handling
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const dailyUrl = `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-300&ed=${dateStr}&geo=US&ns=15&_=${timestamp}`;

    const dailyResponse = await fetch(dailyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (dailyResponse.ok) {
      let text = await dailyResponse.text();
      if (text.startsWith(")]}'")) {
        text = text.substring(4);
      }

      try {
        const data = JSON.parse(text);
        const trends: TrendingSearch[] = [];
        const days = data?.default?.trendingSearchesDays || [];

        for (const day of days) {
          const trendingSearches = day?.trendingSearches || [];
          for (const item of trendingSearches) {
            if (trends.length >= 15) break;
            const title = item?.title?.query;
            if (title && !trends.some(t => t.title === title)) {
              trends.push({
                title,
                searchUrl: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
              });
            }
          }
        }

        if (trends.length > 0) {
          return NextResponse.json({
            trends,
            source: "google-daily",
            timestamp: new Date().toISOString()
          });
        }
      } catch {
        // JSON parse failed
      }
    }

    // Method 4: Try RSS feed via rss2json
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
      "https://trends.google.com/trending/rss?geo=US"
    )}&_=${timestamp}`;

    const proxyResponse = await fetch(rss2jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Dashboard/1.0)",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      if (data.status === "ok" && data.items && data.items.length > 0) {
        const trends: TrendingSearch[] = data.items.slice(0, 15).map((item: { title: string }) => ({
          title: item.title,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
        }));
        return NextResponse.json({
          trends,
          source: "rss2json",
          timestamp: new Date().toISOString()
        });
      }
    }

    // Method 5: Direct RSS fetch
    const rssUrl = `https://trends.google.com/trending/rss?geo=US&_=${timestamp}`;
    const directResponse = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (directResponse.ok) {
      const text = await directResponse.text();
      const trends: TrendingSearch[] = [];

      // Parse RSS XML - try CDATA format first
      let titleMatches = text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
      let count = 0;
      for (const match of titleMatches) {
        if (count > 0 && count <= 15) {
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
          if (count > 0 && count <= 15) {
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
        return NextResponse.json({
          trends,
          source: "google-rss",
          timestamp: new Date().toISOString()
        });
      }
    }

    // Return empty if all methods fail
    return NextResponse.json({
      trends: [],
      source: "none",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching Google Trends:", error);
    return NextResponse.json({
      trends: [],
      source: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
