import { NextResponse } from "next/server";

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  creator?: string;
  categories?: string[];
  thumbnail?: string;
}

export type NewsSource = "zerohedge" | "reason" | "mises";

const RSS_FEEDS: Record<NewsSource, string> = {
  zerohedge: "https://feeds.feedburner.com/zerohedge/feed",
  reason: "https://reason.com/feed/",
  mises: "https://mises.org/feed",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = (searchParams.get("source") as NewsSource) || "zerohedge";

    const feedUrl = RSS_FEEDS[source];
    if (!feedUrl) {
      return NextResponse.json({ error: "Invalid news source" }, { status: 400 });
    }

    // Fetch RSS feed
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsReader/1.0)",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse the XML - articles come in RSS feed order (usually newest first)
    const articles = parseRSS(xmlText);

    return NextResponse.json({ articles, source });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}

function parseRSS(xmlText: string): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Extract items using regex (simple XML parsing without dependencies)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    const title = extractTag(itemContent, "title");
    const link = extractTag(itemContent, "link");
    const pubDate = extractTag(itemContent, "pubDate");
    const description = extractTag(itemContent, "description");
    const creator = extractTag(itemContent, "dc:creator");

    // Extract categories
    const categoryRegex = /<category[^>]*>([^<]*)<\/category>/g;
    const categories: string[] = [];
    let categoryMatch;
    while ((categoryMatch = categoryRegex.exec(itemContent)) !== null) {
      if (categoryMatch[1]) {
        categories.push(decodeHTMLEntities(categoryMatch[1]));
      }
    }

    // Try to extract thumbnail from media:content or enclosure
    let thumbnail = extractAttribute(itemContent, "media:content", "url");
    if (!thumbnail) {
      thumbnail = extractAttribute(itemContent, "enclosure", "url");
    }
    // Also try to extract from description if it contains an img tag
    if (!thumbnail) {
      const imgMatch = description?.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        thumbnail = imgMatch[1];
      }
    }

    if (title && link) {
      articles.push({
        title: decodeHTMLEntities(title),
        link,
        pubDate: pubDate || "",
        description: cleanDescription(description || ""),
        creator: creator ? decodeHTMLEntities(creator) : undefined,
        categories: categories.length > 0 ? categories : undefined,
        thumbnail: thumbnail || undefined,
      });
    }
  }

  return articles;
}

function extractTag(content: string, tagName: string): string | null {
  // Handle CDATA sections
  const cdataRegex = new RegExp(
    `<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`,
    "i"
  );
  const cdataMatch = content.match(cdataRegex);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  // Handle regular tags
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function extractAttribute(
  content: string,
  tagName: string,
  attrName: string
): string | null {
  const regex = new RegExp(`<${tagName}[^>]+${attrName}=["']([^"']+)["']`, "i");
  const match = content.match(regex);
  return match ? match[1] : null;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&nbsp;/g, " ");
}

function cleanDescription(description: string): string {
  // Remove HTML tags but preserve text
  let clean = description
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  clean = decodeHTMLEntities(clean);

  // Truncate to reasonable length
  if (clean.length > 300) {
    clean = clean.substring(0, 300).trim() + "...";
  }

  return clean;
}
