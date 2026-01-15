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

  // Use gemini-2.0-flash with v1beta endpoint and Google Search grounding
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        tools: [
          {
            google_search: {},
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error status:", response.status);
    console.error("Gemini API error body:", errorText);

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

function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 7 ? year + 1 : year;
}

function getSportsRefUrl(league: League, teamSlug: string, year: number): string {
  switch (league) {
    case "nba":
      return `https://www.basketball-reference.com/teams/${teamSlug}/${year}.html`;
    case "ncaa-basketball":
      return `https://www.sports-reference.com/cbb/schools/${teamSlug}/men/${year}.html`;
    case "nfl":
      return `https://www.pro-football-reference.com/teams/${teamSlug}/${year}_roster.htm`;
    case "ncaa-football":
      return `https://www.sports-reference.com/cfb/schools/${teamSlug}/${year}-roster.html`;
    case "mlb":
      return `https://www.baseball-reference.com/teams/${teamSlug}/${year}.shtml`;
    case "nhl":
      return `https://www.hockey-reference.com/teams/${teamSlug}/${year}.html`;
    default:
      throw new Error(`Unknown league: ${league}`);
  }
}

// Common team name to sports-reference slug mappings
const TEAM_SLUGS: Record<string, Record<string, string>> = {
  "ncaa-basketball": {
    "duke": "duke",
    "north carolina": "north-carolina",
    "unc": "north-carolina",
    "kentucky": "kentucky",
    "kansas": "kansas",
    "ucla": "ucla",
    "gonzaga": "gonzaga",
    "villanova": "villanova",
    "michigan state": "michigan-state",
    "michigan": "michigan",
    "ohio state": "ohio-state",
    "indiana": "indiana",
    "purdue": "purdue",
    "iowa": "iowa",
    "iowa state": "iowa-state",
    "texas": "texas",
    "baylor": "baylor",
    "arizona": "arizona",
    "uconn": "connecticut",
    "connecticut": "connecticut",
    "louisville": "louisville",
    "syracuse": "syracuse",
    "florida": "florida",
    "tennessee": "tennessee",
    "auburn": "auburn",
    "alabama": "alabama",
    "arkansas": "arkansas",
    "houston": "houston",
    "creighton": "creighton",
    "marquette": "marquette",
    "st johns": "st-johns-ny",
    "st. johns": "st-johns-ny",
  },
  "nba": {
    "lakers": "LAL",
    "celtics": "BOS",
    "warriors": "GSW",
    "heat": "MIA",
    "bulls": "CHI",
    "knicks": "NYK",
    "nets": "BRK",
    "76ers": "PHI",
    "sixers": "PHI",
    "bucks": "MIL",
    "suns": "PHO",
    "mavericks": "DAL",
    "mavs": "DAL",
    "nuggets": "DEN",
    "clippers": "LAC",
    "thunder": "OKC",
    "rockets": "HOU",
    "spurs": "SAS",
    "grizzlies": "MEM",
    "pelicans": "NOP",
    "timberwolves": "MIN",
    "wolves": "MIN",
    "jazz": "UTA",
    "trail blazers": "POR",
    "blazers": "POR",
    "kings": "SAC",
    "hawks": "ATL",
    "hornets": "CHO",
    "magic": "ORL",
    "wizards": "WAS",
    "cavaliers": "CLE",
    "cavs": "CLE",
    "pistons": "DET",
    "pacers": "IND",
    "raptors": "TOR",
  },
  "nfl": {
    "chiefs": "kan",
    "eagles": "phi",
    "bills": "buf",
    "49ers": "sfo",
    "cowboys": "dal",
    "lions": "det",
    "ravens": "rav",
    "dolphins": "mia",
    "packers": "gnb",
    "bengals": "cin",
    "jets": "nyj",
    "giants": "nyg",
    "broncos": "den",
    "raiders": "rai",
    "chargers": "sdg",
    "seahawks": "sea",
    "cardinals": "crd",
    "rams": "ram",
    "vikings": "min",
    "bears": "chi",
    "saints": "nor",
    "buccaneers": "tam",
    "bucs": "tam",
    "falcons": "atl",
    "panthers": "car",
    "texans": "htx",
    "titans": "oti",
    "colts": "clt",
    "jaguars": "jax",
    "steelers": "pit",
    "browns": "cle",
    "patriots": "nwe",
    "commanders": "was",
  },
};

function getTeamSlug(league: League, teamQuery: string): string {
  const normalizedQuery = teamQuery.toLowerCase().trim();
  const leagueSlugs = TEAM_SLUGS[league];

  if (leagueSlugs && leagueSlugs[normalizedQuery]) {
    return leagueSlugs[normalizedQuery];
  }

  // Default: convert to slug format (lowercase, replace spaces with hyphens)
  return normalizedQuery.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

async function fetchSportsRefPage(url: string): Promise<string> {
  console.log("Fetching sports-reference URL:", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return await response.text();
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

  // Use Gemini with Google Search grounding to get current roster data
  const prompt = `Search for the current ${currentSeason} ${getLeagueConfig(league)?.name} roster for ${teamQuery}.

I need the CURRENT roster for the ${currentSeason} season. Search sports-reference.com or official team sources for accurate, up-to-date information.

For each player on the current roster, provide:
- Jersey number
- Full name
- Position
- Height
- Weight
- Class/Year or Age
- Hometown (City, State/Country)
- High school
- Previous college/team (for transfers)
- What team they played for in each of these seasons: ${seasonYears.join(", ")}

Also provide:
- The official team name
- Team's primary color (hex code)
- Team's secondary color (hex code)

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "teamName": "Full Team Name",
  "primaryColor": "#001A57",
  "secondaryColor": "#FFFFFF",
  "players": [
    {
      "number": "1",
      "name": "Player Name",
      "position": "G",
      "height": "6-2",
      "weight": "185",
      "age": "Jr.",
      "hometown": "City, State",
      "highSchool": "High School Name",
      "previousSchools": ["Previous School"],
      "seasons": [
        {"year": "${seasonYears[0]}", "team": "Current Team"},
        {"year": "${seasonYears[1]}", "team": "Team or null"},
        {"year": "${seasonYears[2]}", "team": "Team or null"},
        {"year": "${seasonYears[3]}", "team": "Team or null"},
        {"year": "${seasonYears[4]}", "team": "Team or null"}
      ]
    }
  ]
}

IMPORTANT:
- Include ALL players currently on the ${currentSeason} roster
- Do NOT include players who have left (graduated, transferred, drafted to NBA, etc.)
- Use null in seasons array if player wasn't playing that year
- Return valid JSON only`;

  const responseText = await callGemini(prompt);

  // Parse the JSON response
  let rosterData;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    rosterData = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("Failed to parse roster response:", responseText);
    throw new Error("Failed to parse roster data from AI response");
  }

  // Geocode player hometowns (limit concurrent requests)
  const playersWithCoords: Player[] = [];
  for (const player of rosterData.players) {
    const coordinates = await geocodeLocation(player.hometown);
    playersWithCoords.push({
      ...player,
      coordinates,
    });
  }

  return {
    teamName: rosterData.teamName,
    league,
    primaryColor: rosterData.primaryColor || "#00bcd4",
    secondaryColor: rosterData.secondaryColor || "#ffffff",
    players: playersWithCoords,
    season: String(currentSeason),
  };
}
