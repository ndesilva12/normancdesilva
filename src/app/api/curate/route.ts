import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { topic, source } = await request.json();
    
    // Build the curate command
    let command = "cd /home/ubuntu/clawd/skills/curate && python3 curate_v3.py";
    
    if (topic && topic !== "general") {
      command += ` --topic "${topic.replace(/"/g, '\\"')}"`;
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
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
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
            source: item.source_name || item.source || "Unknown",
            duration: `${item.estimated_minutes || "?"}min`,
            category: type,
          });
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      items,
      topic: topic || "general",
      source: source || "all",
    });
    
  } catch (error) {
    console.error("Curate error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to curate content",
        details: error instanceof Error ? error.stack : undefined,
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
