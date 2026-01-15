import { League, TeamRoster, Player, LEAGUES } from "@/types/roster";

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

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  // Use gemini-pro (most widely available model)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error status:", response.status);
    console.error("Gemini API error body:", errorText);

    // Parse error for more details
    try {
      const errorJson = JSON.parse(errorText);
      const errorMessage = errorJson.error?.message || errorText;
      throw new Error(`Gemini API error: ${response.status} - ${errorMessage}`);
    } catch {
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Gemini returned no response candidates");
  }

  return data.candidates[0].content.parts[0].text;
}

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY || !location || location === "N/A" || location === "Unknown") {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

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

function getLeagueConfig(league: League) {
  return LEAGUES.find((l) => l.id === league);
}

function getSportsRefUrl(league: League, teamName: string, year: number): string {
  const config = getLeagueConfig(league);
  if (!config) throw new Error(`Unknown league: ${league}`);

  // Different URL patterns for different sports reference sites
  switch (league) {
    case "nba":
      return `https://www.basketball-reference.com/teams/${teamName}/${year}.html`;
    case "ncaa-basketball":
      return `https://www.sports-reference.com/cbb/schools/${teamName}/men/${year}.html`;
    case "nfl":
      return `https://www.pro-football-reference.com/teams/${teamName}/${year}_roster.htm`;
    case "ncaa-football":
      return `https://www.sports-reference.com/cfb/schools/${teamName}/${year}-roster.html`;
    case "mlb":
      return `https://www.baseball-reference.com/teams/${teamName}/${year}.shtml`;
    case "nhl":
      return `https://www.hockey-reference.com/teams/${teamName}/${year}.html`;
    default:
      throw new Error(`Unknown league: ${league}`);
  }
}

function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  // For most sports, season year is the ending year
  // NBA/NHL: Oct-June (season labeled by end year)
  // NFL: Sept-Feb (season labeled by start year)
  // NCAA Basketball: Nov-April (season labeled by end year)
  // NCAA Football: Aug-Jan (season labeled by start year)
  return month >= 7 ? year + 1 : year;
}

export async function fetchTeamRoster(
  league: League,
  teamQuery: string
): Promise<TeamRoster> {
  const currentSeason = getCurrentSeason();
  const seasonYears = [
    currentSeason,
    currentSeason - 1,
    currentSeason - 2,
    currentSeason - 3,
    currentSeason - 4,
  ];

  // Use Gemini to search and parse roster data
  const prompt = `You are a sports data expert. I need you to provide the current roster for the ${teamQuery} ${getLeagueConfig(league)?.name} team.

Search your knowledge for the ${teamQuery} team in ${getLeagueConfig(league)?.name}.

For each player, provide:
- Jersey number
- Full name
- Position
- Height (format: 6-2 or 6'2")
- Weight (in lbs)
- Age or birth year
- Hometown (City, State/Country)
- High school name and location
- Previous college/team (if applicable)
- What team they played for in each of these seasons: ${seasonYears.join(", ")}

Also provide:
- The official team name
- The team's primary color (hex code)
- The team's secondary color (hex code)

Respond with a JSON object in this exact format (no markdown, just raw JSON):
{
  "teamName": "Full official team name",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "players": [
    {
      "number": "23",
      "name": "Player Full Name",
      "position": "PG",
      "height": "6-2",
      "weight": "185",
      "age": "22",
      "hometown": "Chicago, IL",
      "highSchool": "Whitney Young HS (Chicago, IL)",
      "previousSchools": ["Previous College"],
      "seasons": [
        {"year": "${seasonYears[0]}", "team": "Current Team or null"},
        {"year": "${seasonYears[1]}", "team": "Team Name or null"},
        {"year": "${seasonYears[2]}", "team": "Team Name or null"},
        {"year": "${seasonYears[3]}", "team": "Team Name or null"},
        {"year": "${seasonYears[4]}", "team": "Team Name or null"}
      ]
    }
  ]
}

IMPORTANT:
- Include ALL players on the current roster (typically 12-15 for basketball, 53+ for football)
- Use "null" (without quotes in JSON) if player didn't play that season
- Be accurate with the data - use real player information
- For NCAA teams, default to Men's teams
- If you cannot find the exact team, find the closest match and note it in the team name`;

  const responseText = await callGemini(prompt);

  // Parse the JSON response
  let rosterData;
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    rosterData = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("Failed to parse roster response:", responseText);
    throw new Error("Failed to parse roster data from AI response");
  }

  // Geocode player hometowns
  const playersWithCoords: Player[] = await Promise.all(
    rosterData.players.map(async (player: Player) => {
      const coordinates = await geocodeLocation(player.hometown);
      return {
        ...player,
        coordinates,
      };
    })
  );

  return {
    teamName: rosterData.teamName,
    league,
    primaryColor: rosterData.primaryColor || "#00bcd4",
    secondaryColor: rosterData.secondaryColor || "#ffffff",
    players: playersWithCoords,
    season: String(currentSeason),
  };
}
