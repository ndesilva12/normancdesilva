import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleUrl = searchParams.get("url");

    if (!articleUrl) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    // Fetch the article page
    const response = await fetch(articleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();

    // Extract the main article content
    const content = extractArticleContent(html, articleUrl);

    return NextResponse.json({ content, url: articleUrl });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch article" },
      { status: 500 }
    );
  }
}

function extractArticleContent(html: string, url: string): string {
  // Remove scripts, styles, and other non-content elements
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find article content using common selectors
  let articleContent = "";

  // ZeroHedge specific selectors
  if (url.includes("zerohedge.com")) {
    const zhMatch = content.match(/<div[^>]*class="[^"]*NodeContent[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*field--name-field-tags|$)/i);
    if (zhMatch) {
      articleContent = zhMatch[1];
    } else {
      // Alternative: look for article body
      const bodyMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (bodyMatch) {
        articleContent = bodyMatch[1];
      }
    }
  }

  // Reason.com specific
  if (url.includes("reason.com")) {
    const reasonMatch = content.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*article-footer|$)/i);
    if (reasonMatch) {
      articleContent = reasonMatch[1];
    }
  }

  // Mises.org specific
  if (url.includes("mises.org")) {
    const misesMatch = content.match(/<div[^>]*class="[^"]*field--name-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (misesMatch) {
      articleContent = misesMatch[1];
    }
  }

  // Generic fallback: try common article containers
  if (!articleContent) {
    const patterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*article[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*entry[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*main[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1].length > 500) {
        articleContent = match[1];
        break;
      }
    }
  }

  // If still no content, try to extract paragraphs
  if (!articleContent) {
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(content)) !== null) {
      const text = pMatch[1].replace(/<[^>]+>/g, "").trim();
      if (text.length > 100) {
        paragraphs.push(`<p>${cleanText(pMatch[1])}</p>`);
      }
    }
    if (paragraphs.length > 2) {
      articleContent = paragraphs.join("\n");
    }
  }

  // Clean the extracted content
  if (articleContent) {
    // Keep only allowed tags
    articleContent = articleContent
      // Remove unwanted elements
      .replace(/<div[^>]*class="[^"]*(?:share|social|related|comment|sidebar|ad|promo)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<figure[^>]*class="[^"]*(?:embed|video|ad)[^"]*"[^>]*>[\s\S]*?<\/figure>/gi, "")
      // Clean up inline styles and classes
      .replace(/\s*style="[^"]*"/gi, "")
      .replace(/\s*class="[^"]*"/gi, "")
      .replace(/\s*id="[^"]*"/gi, "")
      .replace(/\s*data-[a-z-]+="[^"]*"/gi, "")
      // Keep only basic formatting tags
      .replace(/<(?!\/?(p|br|strong|b|em|i|a|ul|ol|li|blockquote|h[1-6])\b)[^>]+>/gi, "")
      // Clean up links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, (_, href, text) => {
        if (href.startsWith("http") || href.startsWith("/")) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline;">${text}</a>`;
        }
        return text;
      })
      // Clean whitespace
      .replace(/\n\s*\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();

    // Wrap loose text in paragraphs
    articleContent = articleContent
      .split(/(?=<p>|<h[1-6]>|<ul>|<ol>|<blockquote>)/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join("\n\n");
  }

  // Final fallback
  if (!articleContent || articleContent.length < 200) {
    return "<p>Unable to extract article content. Please click \"Open Original\" to read the full article on the source website.</p>";
  }

  // Add some basic styling to the content
  return `<div style="font-family: inherit; color: inherit;">${articleContent}</div>`;
}

function cleanText(text: string): string {
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
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
