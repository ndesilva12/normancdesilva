import { NextRequest, NextResponse } from "next/server";
import { League, LEAGUES, TeamRoster, Player } from "@/types/roster";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

// Call Gemini with Google Search for real-time data
async function callGeminiWithSearch(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 16384,
        },
        tools: [{ google_search: {} }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No response from Gemini");
  }

  return data.candidates[0].content.parts[0].text;
}

// Geocode a location to coordinates
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY || !location || location === "N/A" || location === "Unknown") {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch (error) {
    console.error("Geocoding error for", location, error);
  }

  return null;
}

// Get current basketball season
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Basketball season spans two years (e.g., 2024-25)
  // Season starts in October/November
  if (month >= 9) { // October onwards
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

// Build the prompt based on league type
function buildRosterPrompt(league: League, teamName: string, season: string): string {
  const leagueInfo = LEAGUES.find(l => l.id === league);

  const basePrompt = `Search for the current ${season} roster of the "${teamName}" basketball team in the ${leagueInfo?.name || league}.

I need you to find and return comprehensive roster information. For EACH player on the roster, find:

1. Jersey number
2. Full name
3. Position (PG, SG, SF, PF, C or combo positions)
4. Height (format: "6-5" or "6'5\"")
5. Weight in lbs
6. Age or class year (for college: Fr, So, Jr, Sr, Gr)
7. Hometown (city, state/country where they are from)
8. Current season statistics:
   - Games played
   - Points per game
   - Rebounds per game
   - Assists per game
   - Minutes per game (if available)
9. Prior teams/schools they played for before joining this team

Also find:
- The team's official full name
- The team's primary color (hex code)
- The team's secondary color (hex code)
- The conference/league they play in

Return the data as JSON with this exact structure (no markdown, no backticks):
{
  "teamName": "Full Official Team Name",
  "leagueName": "Conference or League Name",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "players": [
    {
      "number": "23",
      "name": "Player Full Name",
      "position": "SG",
      "height": "6-5",
      "weight": "215",
      "age": "25",
      "hometown": "City, State or City, Country",
      "stats": {
        "gamesPlayed": 45,
        "pointsPerGame": 18.5,
        "reboundsPerGame": 4.2,
        "assistsPerGame": 3.1,
        "minutesPerGame": 32.5
      },
      "priorTeams": [
        { "team": "Previous Team Name", "league": "NBA/NCAA/etc", "years": "2020-2022" }
      ]
    }
  ]
}

IMPORTANT:
- Include ALL players on the current roster
- Use real, accurate data from reliable sources
- For stats, use current season averages (set to 0 if player hasn't played yet)
- For hometown, be as specific as possible (city and state/country)
- priorTeams should list previous professional or college teams (not youth/high school)
- Return ONLY valid JSON, no explanations`;

  return basePrompt;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get("league") as League;
  const team = searchParams.get("team");

  // Validate inputs
  if (!league) {
    return NextResponse.json({ error: "League is required" }, { status: 400 });
  }

  if (!team) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const validLeague = LEAGUES.find((l) => l.id === league);
  if (!validLeague) {
    return NextResponse.json(
      { error: "Invalid league", validLeagues: LEAGUES.map((l) => l.id) },
      { status: 400 }
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API not configured", details: "GEMINI_API_KEY is not set" },
      { status: 503 }
    );
  }

  try {
    const season = getCurrentSeason();
    const prompt = buildRosterPrompt(league, team, season);

    console.log(`Fetching roster for ${team} in ${league} (${season})`);

    // Call Gemini with Google Search
    const responseText = await callGeminiWithSearch(prompt);

    // Parse the JSON response
    let rosterData;
    try {
      // Clean markdown if present
      let cleanedResponse = responseText;
      if (responseText.includes("```")) {
        cleanedResponse = responseText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
      }

      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response:", responseText.substring(0, 1000));
        throw new Error("No valid roster data found");
      }

      rosterData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse roster data");
    }

    // Validate we got players
    if (!rosterData.players || rosterData.players.length === 0) {
      return NextResponse.json(
        { error: "Team not found", details: `Could not find roster for "${team}" in ${validLeague.name}` },
        { status: 404 }
      );
    }

    // Geocode hometowns for map feature
    const playersWithCoords: Player[] = [];
    for (const player of rosterData.players) {
      const coordinates = await geocodeLocation(player.hometown);
      playersWithCoords.push({
        ...player,
        stats: player.stats || {
          gamesPlayed: 0,
          pointsPerGame: 0,
          reboundsPerGame: 0,
          assistsPerGame: 0,
        },
        priorTeams: player.priorTeams || [],
        coordinates: coordinates ?? undefined,
      });
    }

    const roster: TeamRoster = {
      teamName: rosterData.teamName || team,
      league,
      leagueName: rosterData.leagueName || validLeague.name,
      primaryColor: rosterData.primaryColor || "#00bcd4",
      secondaryColor: rosterData.secondaryColor || "#ffffff",
      players: playersWithCoords,
      season,
    };

    console.log(`Successfully fetched ${roster.players.length} players for ${roster.teamName}`);

    return NextResponse.json({
      success: true,
      data: roster,
    });

  } catch (error) {
    console.error("Error fetching roster:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Please wait a moment and try again" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch roster", details: errorMessage },
      { status: 500 }
    );
  }
}
