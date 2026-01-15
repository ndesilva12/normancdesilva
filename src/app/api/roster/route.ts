import { NextRequest, NextResponse } from "next/server";
import { fetchTeamRoster } from "@/lib/roster-service";
import { League, LEAGUES } from "@/types/roster";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get("league") as League;
  const team = searchParams.get("team");

  if (!league) {
    return NextResponse.json(
      { error: "League is required" },
      { status: 400 }
    );
  }

  if (!team) {
    return NextResponse.json(
      { error: "Team name is required" },
      { status: 400 }
    );
  }

  // Validate league
  const validLeague = LEAGUES.find((l) => l.id === league);
  if (!validLeague) {
    return NextResponse.json(
      { error: "Invalid league", validLeagues: LEAGUES.map((l) => l.id) },
      { status: 400 }
    );
  }

  // Check if Gemini API key is configured
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error: "Gemini API not configured",
        details: "GEMINI_API_KEY is not set in environment variables",
      },
      { status: 503 }
    );
  }

  try {
    const roster = await fetchTeamRoster(league, team);

    return NextResponse.json({
      success: true,
      data: roster,
    });
  } catch (error) {
    console.error("Error fetching roster:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("401") || errorMessage.includes("403")) {
      return NextResponse.json(
        { error: "API authentication failed", details: "Check your Gemini API key" },
        { status: 401 }
      );
    }

    if (errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Too many requests, please try again later" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch roster", details: errorMessage },
      { status: 500 }
    );
  }
}
