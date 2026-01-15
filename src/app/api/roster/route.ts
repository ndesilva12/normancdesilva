import { NextRequest, NextResponse } from "next/server";
import { fetchTeamRoster } from "@/lib/roster-service";
import { getCachedRoster, cacheRoster } from "@/lib/roster-cache";
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
    // Check cache first
    const cachedRoster = getCachedRoster(league, team);
    if (cachedRoster) {
      return NextResponse.json({
        success: true,
        data: cachedRoster,
        cached: true,
      });
    }

    // Fetch from API
    const roster = await fetchTeamRoster(league, team);

    // Cache the result
    cacheRoster(league, team, roster);

    return NextResponse.json({
      success: true,
      data: roster,
      cached: false,
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
        { error: "Rate limit exceeded", details: "Gemini API rate limit hit. Please wait 30-60 seconds and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch roster", details: errorMessage },
      { status: 500 }
    );
  }
}
