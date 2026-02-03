import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// Use Clawdbot agent command to communicate with Jimmy
export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Escape single quotes in the message for shell
    const escapedQuery = query.replace(/'/g, "'\\''");
    
    // Use clawdbot agent command with webchat session (full path)
    // This creates a persistent session for the web interface
    const command = `/home/ubuntu/.npm-global/bin/clawdbot agent --session-id "webchat-${userId || 'anonymous'}" --message '${escapedQuery}' --json --timeout 30`;
    
    console.log("[Jimmy API] Sending message to Clawdbot");
    
    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: 35000, // 35 second timeout (5s more than agent timeout)
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr) {
        console.error("[Jimmy API] Clawdbot stderr:", stderr);
      }

      // Parse the JSON response
      try {
        const response = JSON.parse(stdout.trim());
        
        // Check if the response was successful
        if (response.status !== "ok") {
          throw new Error(`Agent returned status: ${response.status}`);
        }
        
        // Extract the text from the first payload
        const content = response.result?.payloads?.[0]?.text || "No response from Jimmy";
        
        console.log("[Jimmy API] Response received:", content.substring(0, 100));
        
        return NextResponse.json({
          content: content,
          meta: response.result?.meta,
        });
      } catch (parseError) {
        console.error("[Jimmy API] Failed to parse response:", parseError);
        console.error("[Jimmy API] Raw output:", stdout);
        
        return NextResponse.json(
          { error: "Received invalid response from Jimmy" },
          { status: 500 }
        );
      }
    } catch (execError: any) {
      console.error("[Jimmy API] Clawdbot exec error:", execError);
      
      // Check if it's a timeout
      if (execError.killed && execError.signal === 'SIGTERM') {
        return NextResponse.json(
          { error: "Request timed out. Jimmy is taking too long to respond." },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { error: `Error communicating with Jimmy: ${execError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Jimmy API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to communicate with Jimmy" },
      { status: 500 }
    );
  }
}
