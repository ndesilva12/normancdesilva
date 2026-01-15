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

// Extract player page URLs from roster HTML
function extractPlayerUrls(rosterHtml: string, league: League): Map<string, string> {
  const playerUrls = new Map<string, string>();
  const leagueConfig = getLeagueConfig(league);
  if (!leagueConfig) return playerUrls;

  // Match player links in the roster table
  // Pattern varies by site: /players/, /en/players/, etc.
  const linkPattern = /<a\s+href="([^"]*\/players?\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(rosterHtml)) !== null) {
    const path = match[1];
    const name = match[2].trim();

    const fullUrl = path.startsWith("http") ? path : `${leagueConfig.baseUrl}${path}`;
    playerUrls.set(name.toLowerCase(), fullUrl);
  }

  return playerUrls;
}

// Extract stats tables from player page HTML
function extractStatsTables(html: string): string {
  // Look for common table IDs used by sports-reference sites
  const tablePatterns = [
    // Per Game stats (most common for basketball)
    /<table[^>]*id="players_per_game"[^>]*>[\s\S]*?<\/table>/i,
    /<table[^>]*id="per_game"[^>]*>[\s\S]*?<\/table>/i,
    // Totals table
    /<table[^>]*id="players_totals"[^>]*>[\s\S]*?<\/table>/i,
    /<table[^>]*id="totals"[^>]*>[\s\S]*?<\/table>/i,
    // Generic stats tables
    /<table[^>]*id="stats"[^>]*>[\s\S]*?<\/table>/i,
    /<table[^>]*class="[^"]*stats_table[^"]*"[^>]*>[\s\S]*?<\/table>/i,
    // Career/season tables
    /<table[^>]*id="player_stats"[^>]*>[\s\S]*?<\/table>/i,
  ];

  const foundTables: string[] = [];

  for (const pattern of tablePatterns) {
    const match = html.match(pattern);
    if (match) {
      foundTables.push(match[0]);
    }
  }

  // If we found specific tables, return them
  if (foundTables.length > 0) {
    return foundTables.join("\n\n");
  }

  // Fallback: try to find any table with year/season data
  const genericTableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
  if (genericTableMatch) {
    // Filter to tables that look like they have season data (contain year patterns like "2024" or "2023-24")
    const seasonTables = genericTableMatch.filter(table =>
      /20\d{2}(-\d{2})?/.test(table) && table.length < 50000
    );
    if (seasonTables.length > 0) {
      return seasonTables.slice(0, 2).join("\n\n"); // Return first 2 matching tables
    }
  }

  // Last resort: return a chunk of the page
  return html.substring(0, 20000);
}

// Fetch and parse a single player's page for their history
async function fetchPlayerHistory(
  playerName: string,
  playerUrl: string,
  currentSeason: number,
  league: League
): Promise<{ previousSchools: string[]; seasons: { year: string; team: string | null }[] } | null> {
  try {
    console.log(`Fetching player page for ${playerName}: ${playerUrl}`);
    const html = await fetchSportsRefPage(playerUrl);

    // Extract the relevant stats tables
    const statsTables = extractStatsTables(html);

    // Use Gemini to parse the player's history from the stats tables
    const prompt = `Parse this player's career history from their sports-reference stats tables.

The tables below show year-by-year statistics. Each row typically has:
- Season/Year (e.g., "2024-25", "2023-24", or just "2024")
- School/Team name (the team they played for that season)

Extract the team name for each season from the table rows.

Stats Tables:
${statsTables}

Current season is ${currentSeason}. Return data for the last 5 seasons.

Return ONLY valid JSON (no markdown, no explanation):
{
  "previousSchools": ["Team1", "Team2"],
  "seasons": [
    {"year": "${currentSeason}", "team": "Team Name from table"},
    {"year": "${currentSeason - 1}", "team": "Team Name or null"},
    {"year": "${currentSeason - 2}", "team": "Team Name or null"},
    {"year": "${currentSeason - 3}", "team": "Team Name or null"},
    {"year": "${currentSeason - 4}", "team": "Team Name or null"}
  ]
}

IMPORTANT:
- previousSchools = teams BEFORE their current team (oldest first). Empty array if they've only played for one team.
- Look at each table row - the "School" or "Team" column shows where they played that year
- If a player transferred, they'll have different team names in different years
- Use null for years before they started playing (e.g., high school years)`;

    const response = await callGemini(prompt, false);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error(`Failed to fetch history for ${playerName}:`, error);
  }

  return null;
}

// Enrich players by fetching their individual sports-reference pages
async function enrichPlayersFromSportsRef(
  players: BasicPlayer[],
  rosterHtml: string,
  league: League,
  currentSeason: number
): Promise<BasicPlayer[]> {
  const playerUrls = extractPlayerUrls(rosterHtml, league);
  console.log(`Found ${playerUrls.size} player page URLs`);

  const enrichedPlayers: BasicPlayer[] = [];

  for (const player of players) {
    const playerUrl = playerUrls.get(player.name.toLowerCase());

    if (playerUrl) {
      const history = await fetchPlayerHistory(player.name, playerUrl, currentSeason, league);

      if (history) {
        enrichedPlayers.push({
          ...player,
          previousSchools: history.previousSchools?.length > 0
            ? history.previousSchools
            : player.previousSchools,
          seasons: history.seasons || player.seasons,
        });
        continue;
      }
    }

    // No URL found or fetch failed - keep original data
    enrichedPlayers.push(player);
  }

  return enrichedPlayers;
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
    case "soccer":
      // fbref uses format: /en/squads/team-id/Team-Name-Stats
      return `https://fbref.com/en/squads/${teamSlug}`;
    case "euroleague":
      // eurobasket uses team pages
      return `https://www.eurobasket.com/team/${teamSlug}`;
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
  "soccer": {
    // FBref uses unique team IDs - format: /en/squads/{id}/{Team-Name}-Stats
    "manchester united": "19538871/Manchester-United",
    "man united": "19538871/Manchester-United",
    "manchester city": "b8fd03ef/Manchester-City",
    "man city": "b8fd03ef/Manchester-City",
    "liverpool": "822bd0ba/Liverpool",
    "arsenal": "18bb7c10/Arsenal",
    "chelsea": "cff3d9bb/Chelsea",
    "tottenham": "361ca564/Tottenham-Hotspur",
    "spurs": "361ca564/Tottenham-Hotspur",
    "real madrid": "53a2f082/Real-Madrid",
    "barcelona": "206d90db/Barcelona",
    "barca": "206d90db/Barcelona",
    "bayern munich": "054efa67/Bayern-Munich",
    "bayern": "054efa67/Bayern-Munich",
    "psg": "e2d8892c/Paris-Saint-Germain",
    "paris saint-germain": "e2d8892c/Paris-Saint-Germain",
    "juventus": "e0652b02/Juventus",
    "inter milan": "d609edc0/Inter",
    "inter": "d609edc0/Inter",
    "ac milan": "dc56fe14/Milan",
    "milan": "dc56fe14/Milan",
    "atletico madrid": "db3b9613/Atletico-Madrid",
    "atletico": "db3b9613/Atletico-Madrid",
    "borussia dortmund": "add600ae/Borussia-Dortmund",
    "dortmund": "add600ae/Borussia-Dortmund",
  },
  "euroleague": {
    // EuroBasket team slugs
    "real madrid": "Real-Madrid",
    "barcelona": "Barcelona",
    "olympiacos": "Olympiacos",
    "panathinaikos": "Panathinaikos",
    "fenerbahce": "Fenerbahce",
    "anadolu efes": "Anadolu-Efes",
    "cska moscow": "CSKA-Moscow",
    "maccabi tel aviv": "Maccabi-Tel-Aviv",
    "maccabi": "Maccabi-Tel-Aviv",
    "zalgiris": "Zalgiris",
    "baskonia": "Baskonia",
    "milan": "AX-Armani-Exchange-Milan",
    "virtus bologna": "Virtus-Bologna",
    "partizan": "Partizan",
    "bayern munich": "Bayern-Munich",
    "monaco": "AS-Monaco",
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

  // Enrich player data by fetching individual player pages from sports-reference
  console.log("Enriching player data from sports-reference player pages...");
  const enrichedPlayers = await enrichPlayersFromSportsRef(
    rosterData.players,
    htmlContent,
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
