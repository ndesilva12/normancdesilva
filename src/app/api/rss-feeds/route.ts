import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

const RSS_FEEDS = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
];

export async function GET() {
  try {
    const allArticles = await Promise.all(
      RSS_FEEDS.map(async (feed) => {
        try {
          const feedData = await parser.parseURL(feed.url);
          return (feedData.items || []).slice(0, 5).map((item) => ({
            title: item.title || "Untitled",
            link: item.link || "",
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            description: item.contentSnippet || item.content || "",
            source: feed.name,
          }));
        } catch (error) {
          console.error(`Error fetching ${feed.name}:`, error);
          return [];
        }
      })
    );

    // Flatten and sort by date
    const articles = allArticles
      .flat()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 50);

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSS feeds" },
      { status: 500 }
    );
  }
}
