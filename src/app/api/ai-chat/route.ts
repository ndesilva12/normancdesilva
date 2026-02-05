import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Forward AI queries to Clawdbot (uses Norman's Claude subscription)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const source = searchParams.get("source"); // "claude" or "grok"

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    // Call Clawdbot via CLI to get response
    // This uses Norman's Claude Code subscription (not API credits)
    const command = `echo '${query.replace(/'/g, "'\\''")}' | clawdbot chat --non-interactive --model ${source === "grok" ? "grok" : "claude-sonnet-4"}`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    return NextResponse.json({ 
      content: stdout.trim(),
      source 
    });
  } catch (error) {
    console.error(`AI chat error for ${source}:`, error);
    const errorMessage = error instanceof Error ? error.message : "AI chat failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST endpoint for conversation continuation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, source } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // For now, just treat as new query (conversation history not supported via CLI)
    const command = `echo '${query.replace(/'/g, "'\\''")}' | clawdbot chat --non-interactive --model ${source === "grok" ? "grok" : "claude-sonnet-4"}`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    return NextResponse.json({ 
      content: stdout.trim(),
      source 
    });
  } catch (error) {
    console.error("AI chat POST error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
