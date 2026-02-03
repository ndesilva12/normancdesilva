import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }
    
    // Use the Python research script from project root
    const projectRoot = process.cwd();
    const scriptPath = `${projectRoot}/scripts/l3d-research.py`;
    const command = `python3 ${scriptPath} --query "${query.replace(/"/g, '\\"')}" --output json`;
    
    console.log("Executing L3D research command:", command);
    
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 1 minute timeout
      maxBuffer: 5 * 1024 * 1024, // 5MB buffer
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        BRAVE_API_KEY: process.env.BRAVE_API_KEY || "BSAN41sbCIBbhckWBTYmYAk_44Kug7g",
      },
    });
    
    if (stderr) {
      console.error("L3D stderr:", stderr);
    }
    
    // Parse the JSON output
    const result = JSON.parse(stdout);
    
    return NextResponse.json({
      success: true,
      result,
      query,
    });
    
  } catch (error) {
    console.error("Last30Days error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to research topic",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Last 30 Days Research API - Use POST to research a topic",
    endpoints: {
      POST: "/api/last30days",
    },
    parameters: {
      query: "Research topic (required)",
    },
  });
}
