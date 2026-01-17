import { NextRequest, NextResponse } from "next/server";
import { League, LEAGUES, TeamRoster, Player, TeamProfile } from "@/types/roster";
import { getCachedRoster, cacheRoster } from "@/lib/roster-cache";

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
          maxOutputTokens: 32768,
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

  const basePrompt = `Search for comprehensive information about the "${teamName}" basketball team in the ${leagueInfo?.name || league} for the ${season} season.

I need TWO things:

## 1. TEAM PROFILE
Find and return:
- Team's official logo URL (direct image URL, preferably from Wikipedia or official sources)
- Year the team/program was founded
- Home arena/stadium name
- City and state/country location
- Number of championships won (if any)
- Head coach name and years with team
- Assistant coaches (top 1-2)
- Current season record (wins-losses)
- Win percentage
- Points per game (team average)
- Points allowed per game
- Rebounds per game (team average)
- Assists per game (team average)
- Conference/division ranking
- Overall ranking (if available)
- Last 5 game results (W/L with opponent and score)

## 2. PLAYER ROSTER
For EACH player on the current roster, find:
- Jersey number
- Full name
- Position (PG, SG, SF, PF, C)
- Height (format: "6-5")
- Weight in lbs
- Age or class year (for college: Fr, So, Jr, Sr, Gr)
- Hometown (city, state/country)
- Current season stats: games played, PPG, RPG, APG, MPG
- Prior teams/schools before this team

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no explanation):
{
  "teamName": "Full Official Team Name",
  "leagueName": "Conference or League Name",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "profile": {
    "logoUrl": "https://direct-image-url.png",
    "founded": "1946",
    "arena": "Arena Name",
    "city": "City Name",
    "state": "State/Province",
    "country": "Country",
    "championships": 17,
    "coaches": [
      { "name": "Head Coach Name", "role": "Head Coach", "yearsWithTeam": 5 },
      { "name": "Assistant Name", "role": "Assistant Coach" }
    ],
    "stats": {
      "wins": 35,
      "losses": 20,
      "winPercentage": 0.636,
      "pointsPerGame": 112.5,
      "pointsAllowedPerGame": 108.2,
      "reboundsPerGame": 44.5,
      "assistsPerGame": 26.3,
      "conferenceRank": 3,
      "overallRank": 8
    },
    "recentResults": [
      "W vs Lakers 115-108",
      "W vs Heat 122-110",
      "L vs Celtics 105-118",
      "W vs Bulls 130-112",
      "L vs Bucks 99-105"
    ]
  },
  "players": [
    {
      "number": "23",
      "name": "Player Full Name",
      "position": "SG",
      "height": "6-5",
      "weight": "215",
      "age": "25",
      "hometown": "City, State",
      "stats": {
        "gamesPlayed": 45,
        "pointsPerGame": 18.5,
        "reboundsPerGame": 4.2,
        "assistsPerGame": 3.1,
        "minutesPerGame": 32.5
      },
      "priorTeams": [
        { "team": "Previous Team", "league": "NBA", "years": "2020-2022" }
      ]
    }
  ]
}

IMPORTANT:
- Use REAL, ACCURATE, CURRENT data from reliable sources
- For logoUrl, try to find a direct PNG or SVG image URL (Wikipedia, ESPN, or official team site)
- Include ALL players on the current roster
- For stats, use current ${season} season averages
- Return ONLY valid JSON`;

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

    // Check cache first
    const cached = await getCachedRoster(league, team);
    if (cached) {
      console.log(`Returning cached roster for ${team} in ${league}`);
      return NextResponse.json({
        success: true,
        data: cached.roster,
        fromCache: true,
      });
    }

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

    // Build team profile with defaults
    const profile: TeamProfile = rosterData.profile ? {
      logoUrl: rosterData.profile.logoUrl,
      founded: rosterData.profile.founded,
      arena: rosterData.profile.arena || "Unknown Arena",
      city: rosterData.profile.city || "Unknown",
      state: rosterData.profile.state,
      country: rosterData.profile.country || "USA",
      championships: rosterData.profile.championships || 0,
      coaches: rosterData.profile.coaches || [],
      stats: rosterData.profile.stats || {
        wins: 0,
        losses: 0,
        winPercentage: 0,
        pointsPerGame: 0,
        pointsAllowedPerGame: 0,
      },
      recentResults: rosterData.profile.recentResults || [],
    } : {
      arena: "Unknown",
      city: "Unknown",
      country: "USA",
      coaches: [],
      stats: {
        wins: 0,
        losses: 0,
        winPercentage: 0,
        pointsPerGame: 0,
        pointsAllowedPerGame: 0,
      },
    };

    const roster: TeamRoster = {
      teamName: rosterData.teamName || team,
      league,
      leagueName: rosterData.leagueName || validLeague.name,
      primaryColor: rosterData.primaryColor || "#00bcd4",
      secondaryColor: rosterData.secondaryColor || "#ffffff",
      players: playersWithCoords,
      season,
      profile,
    };

    console.log(`Successfully fetched ${roster.players.length} players for ${roster.teamName}`);

    // Cache the result for faster future lookups
    await cacheRoster(league, team, roster);

    return NextResponse.json({
      success: true,
      data: roster,
      fromCache: false,
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
