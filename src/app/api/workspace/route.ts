import { NextRequest, NextResponse } from "next/server";

// Simple workspace endpoint that extends existing functionality
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  // Check configuration
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json(
      { error: "NOTION_API_KEY environment variable is not set." },
      { status: 500 }
    );
  }

  try {
    // For now, just return a simple response that indicates workspace features are coming
    if (action === "overview") {
      return NextResponse.json({
        message: "Workspace overview coming soon",
        hasWorkspaceAccess: !!process.env.NOTION_API_KEY,
      });
    }

    return NextResponse.json({
      message: "Workspace API ready",
      actions: ["overview"],
    });
  } catch (error) {
    console.error("Workspace API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}