import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { topic, source } = await request.json();
    
    // For now, return mock data until the curate script is ready
    // TODO: Uncomment the actual implementation below once dependencies are resolved
    
    const mockItems = [
      {
        id: "short-unique-1",
        title: "Understanding Austrian Economics: A First Principles Approach",
        url: "https://twitter.com/example/status/123",
        summary: "Deep dive into how Austrian economics explains market cycles through time preference and capital structure.",
        source: "X (@libertarian_economist)",
        duration: "3 min",
        category: "short-unique" as const,
      },
      {
        id: "short-unique-2",
        title: "Hidden NBA Analytics: Why Box Score Stats Mislead",
        url: "https://reddit.com/r/nba/comments/example",
        summary: "Statistical breakdown showing how traditional stats miss defensive positioning and off-ball movement impact.",
        source: "Reddit (r/nba)",
        duration: "4 min",
        category: "short-unique" as const,
      },
      {
        id: "short-trending-1",
        title: "Fed Rate Decision: Contrarian Analysis",
        url: "https://twitter.com/example/status/456",
        summary: "Breaking down why today's Fed decision reveals hidden liquidity crisis that mainstream media is missing.",
        source: "X (@economic_contrarian)",
        duration: "5 min",
        category: "short-trending" as const,
      },
      {
        id: "long-unique-1",
        title: "The Real Story Behind Woodrow Wilson and the Federal Reserve",
        url: "https://youtube.com/watch?v=example",
        summary: "Documentary revealing primary source documents showing banker influence on Federal Reserve Act creation.",
        source: "YouTube (History Uncensored)",
        duration: "45 min",
        category: "long-unique" as const,
      },
      {
        id: "long-trending-1",
        title: "Joe Rogan: Intelligence Agencies and Tech Company Origins",
        url: "https://youtube.com/watch?v=example2",
        summary: "Viral episode with investigative journalist connecting CIA funding to major tech company foundings.",
        source: "YouTube (Joe Rogan Experience)",
        duration: "2h 15min",
        category: "long-trending" as const,
      },
    ];
    
    return NextResponse.json({
      success: true,
      items: mockItems,
      topic: topic || "general",
      source: source || "all",
      note: "Using mock data - curate script integration pending",
    });
    
    /* ACTUAL IMPLEMENTATION - Uncomment when ready:
    
    // Build the curate command
    let command = "python3 /home/ubuntu/clawd/skills/curate/curate_v3.py";
    
    if (topic && topic !== "general") {
      command += ` --topic "${topic}"`;
    }
    
    if (source && source !== "all") {
      command += ` --source "${source}"`;
    }
    
    // Add JSON output flag and skip notion
    command += " --output json --skip-notion";
    
    console.log("Executing curate command:", command);
    
    // Execute the curate script
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (stderr) {
      console.error("Curate stderr:", stderr);
    }
    
    // Parse the JSON output
    const result = JSON.parse(stdout);
    
    // Transform the result into the expected format
    const items = [];
    
    // Process each category
    const categories = [
      { key: 'short_unique', type: 'short-unique' },
      { key: 'short_trending', type: 'short-trending' },
      { key: 'long_unique', type: 'long-unique' },
      { key: 'long_trending', type: 'long-trending' },
    ];
    
    for (const { key, type } of categories) {
      if (result[key] && Array.isArray(result[key])) {
        result[key].forEach((item: any, index: number) => {
          items.push({
            id: `${type}-${index}`,
            title: item.title || "Untitled",
            url: item.url || "#",
            summary: item.summary || "No summary available",
            source: item.source || "Unknown",
            duration: item.duration || "Unknown",
            category: type,
          });
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      items,
      topic,
      source,
    });
    */
    
  } catch (error) {
    console.error("Curate error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to curate content",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Curate API - Use POST to curate content",
    endpoints: {
      POST: "/api/curate",
    },
    parameters: {
      topic: "Topic to curate (optional, defaults to 'general')",
      source: "Source filter: all, x, reddit, youtube, articles, podcasts (optional)",
    },
  });
}
