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

async function callGemini(prompt: string, useSearch: boolean = false): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  // Build request body
  const requestBody: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  // Add Google Search tool if requested
  if (useSearch) {
    requestBody.tools = [{ google_search: {} }];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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

interface BasicPlayer {
  number: string;
  name: string;
  position: string;
  height: string;
  weight: string;
  age: string;
  hometown: string;
  highSchool: string;
  previousSchools: string[];
  seasons: { year: string; team: string | null }[];
}

async function enrichPlayerData(
  players: BasicPlayer[],
  teamName: string,
  league: League,
  currentSeason: number
): Promise<BasicPlayer[]> {
  const seasonYears = [
    currentSeason,
    currentSeason - 1,
    currentSeason - 2,
    currentSeason - 3,
    currentSeason - 4,
  ];

  // Build a detailed list of players with what we know
  const playerList = players.map(p =>
    `- ${p.name} (#${p.number}, ${p.position}, ${p.age || 'class unknown'})`
  ).join("\n");

  const enrichPrompt = `Search for transfer portal and recruiting information for these ${teamName} college basketball players (${currentSeason} season).

PLAYERS TO RESEARCH:
${playerList}

For EACH player, search for:
1. Their complete college basketball history - which schools did they play for BEFORE ${teamName}?
2. Transfer portal entries - many college players are transfers from other programs
3. Their recruiting profile (247sports, rivals, etc.) to find their high school

IMPORTANT CONTEXT:
- College basketball has a transfer portal - players frequently transfer between schools
- Search for "[player name] transfer" or "[player name] college basketball" to find history
- For example, if a Senior transferred from School A to ${teamName}, they played at School A for years before joining ${teamName}
- Freshmen typically have no previous college (use null for previous years)
- Check if any players came from junior college (JUCO) programs

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "players": [
    {
      "name": "Exact Player Name",
      "previousSchools": ["School Before Current", "Even Earlier School"],
      "highSchool": "High School Name",
      "seasons": [
        {"year": "${seasonYears[0]}", "team": "${teamName}"},
        {"year": "${seasonYears[1]}", "team": "Previous school name OR ${teamName} if they were there OR null if not in college"},
        {"year": "${seasonYears[2]}", "team": "School name or null"},
        {"year": "${seasonYears[3]}", "team": "School name or null"},
        {"year": "${seasonYears[4]}", "team": "School name or null"}
      ]
    }
  ]
}

CRITICAL INSTRUCTIONS:
- Return data for ALL ${players.length} players
- Use the EXACT player names from the list above
- If a player transferred, their previousSchools array should NOT be empty
- For seasons, use the actual school name they played at that year, not "${teamName}" for years before they transferred
- Use null for years the player was in high school or not playing college basketball`;

  try {
    console.log("Calling Gemini with Google Search for transfer history...");
    const enrichResponse = await callGemini(enrichPrompt, true);
    console.log("Enrichment response received, parsing...");

    const jsonMatch = enrichResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("No JSON found in enrichment response");
      return players;
    }

    const enrichData = JSON.parse(jsonMatch[0]);
    console.log(`Enrichment found data for ${enrichData.players?.length || 0} players`);

    // Merge enrichment data with original players
    return players.map(player => {
      const enrichedPlayer = enrichData.players?.find(
        (ep: { name: string }) =>
          ep.name.toLowerCase().trim() === player.name.toLowerCase().trim() ||
          ep.name.toLowerCase().includes(player.name.toLowerCase()) ||
          player.name.toLowerCase().includes(ep.name.toLowerCase())
      );

      if (enrichedPlayer) {
        const hasPreviousSchools = enrichedPlayer.previousSchools?.length > 0 &&
          enrichedPlayer.previousSchools.some((s: string) => s && s !== "N/A" && s !== "None");

        return {
          ...player,
          previousSchools: hasPreviousSchools
            ? enrichedPlayer.previousSchools.filter((s: string) => s && s !== "N/A" && s !== "None")
            : player.previousSchools,
          highSchool: (enrichedPlayer.highSchool && enrichedPlayer.highSchool !== "N/A")
            ? enrichedPlayer.highSchool
            : player.highSchool,
          seasons: enrichedPlayer.seasons || player.seasons,
        };
      }

      return player;
    });
  } catch (error) {
    console.error("Enrichment failed, using original data:", error);
    return players;
  }
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
  const teamSlug = getTeamSlug(league, teamQuery);
  const url = getSportsRefUrl(league, teamSlug, currentSeason);

  // Fetch the actual HTML from sports-reference.com
  let htmlContent: string;
  try {
    htmlContent = await fetchSportsRefPage(url);
  } catch (fetchError) {
    console.error("Failed to fetch sports-reference page:", fetchError);
    throw new Error(`Could not find team "${teamQuery}" on sports-reference.com. Try using the official team name (e.g., "duke" not "Duke Blue Devils").`);
  }

  // Extract roster table from the HTML
  const rosterTableMatch = htmlContent.match(/<table[^>]*id="roster"[^>]*>[\s\S]*?<\/table>/i) ||
                           htmlContent.match(/<table[^>]*class="[^"]*roster[^"]*"[^>]*>[\s\S]*?<\/table>/i);

  if (!rosterTableMatch) {
    throw new Error("Could not find roster table on the page. The team page may have a different structure.");
  }

  const tableHtml = rosterTableMatch[0];

  const seasonYears = [
    currentSeason,
    currentSeason - 1,
    currentSeason - 2,
    currentSeason - 3,
    currentSeason - 4,
  ];

  // Use Gemini to parse the HTML table
  const prompt = `Parse this HTML roster table from sports-reference.com for the ${teamQuery} ${getLeagueConfig(league)?.name} team.

HTML Table:
${tableHtml}

Extract ALL players from this table. For each player, extract:
- Jersey number (from # or No. column)
- Full name (from Player or Name column)
- Position (from Pos column)
- Height (from Ht or Height column, format as "6-2")
- Weight (from Wt or Weight column, just the number)
- Class/Year (from Class or Yr column - Fr, So, Jr, Sr)
- Hometown/Birthplace if available
- High school if available
- Previous school if available (for transfers)

Also provide:
- Team name: "${teamQuery}" official name
- Primary color hex code for ${teamQuery}
- Secondary color hex code for ${teamQuery}

For the seasons array, based on the player's class year, determine what years they played:
- A Senior (Sr) in ${currentSeason} played: ${seasonYears.slice(0, 4).join(", ")}
- A Junior (Jr) in ${currentSeason} played: ${seasonYears.slice(0, 3).join(", ")}
- A Sophomore (So) in ${currentSeason} played: ${seasonYears.slice(0, 2).join(", ")}
- A Freshman (Fr) in ${currentSeason} played: ${seasonYears[0]} only

Respond with ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "teamName": "Full Official Team Name",
  "primaryColor": "#001A57",
  "secondaryColor": "#FFFFFF",
  "players": [
    {
      "number": "1",
      "name": "Player Full Name",
      "position": "G",
      "height": "6-2",
      "weight": "185",
      "age": "Jr.",
      "hometown": "City, State",
      "highSchool": "High School Name",
      "previousSchools": [],
      "seasons": [
        {"year": "${seasonYears[0]}", "team": "${teamQuery}"},
        {"year": "${seasonYears[1]}", "team": "${teamQuery} or null"},
        {"year": "${seasonYears[2]}", "team": "null if freshman/sophomore"},
        {"year": "${seasonYears[3]}", "team": "null if not senior"},
        {"year": "${seasonYears[4]}", "team": "null"}
      ]
    }
  ]
}

CRITICAL: Extract EVERY player row from the table. Do not skip any players. Return valid JSON only.`;

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

  // Enrich player data with transfer history using Google Search
  console.log("Enriching player data with transfer history...");
  const enrichedPlayers = await enrichPlayerData(
    rosterData.players,
    rosterData.teamName || teamQuery,
    league,
    currentSeason
  );

  // Geocode player hometowns (limit concurrent requests)
  const playersWithCoords: Player[] = [];
  for (const player of enrichedPlayers) {
    const coordinates = await geocodeLocation(player.hometown);
    playersWithCoords.push({
      ...player,
      coordinates: coordinates ?? undefined,
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
