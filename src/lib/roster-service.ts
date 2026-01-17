import { League, TeamRoster, Player, LEAGUES } from "@/types/roster";
import { getCached, setCache, generateCacheKey, getRosterTTL, recordCacheAccess } from "./firestore-cache";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;
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

interface GrokResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Call Grok API for player history parsing (better at structured extraction)
async function callGrok(prompt: string): Promise<string> {
  if (!XAI_API_KEY) {
    throw new Error("Grok API key not configured");
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-2",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Grok API error:", response.status, errorText);
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data: GrokResponse = await response.json();
  return data.choices[0]?.message?.content || "";
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
  playerUrl?: string;
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

// Extract birthplace from player page HTML
function extractBirthplace(html: string): string | null {
  // Pattern: "Born: Month Day, Year in City, State" or similar
  const birthPatterns = [
    /Born:\s*[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\s+in\s+([^<\n]+)/i,
    /born\s+[^,]+,\s+\d{4}\s+in\s+([^<\n]+)/i,
    /Birthplace:\s*([^<\n]+)/i,
    /birth_place['":\s]+([^'"<\n,]+(?:,\s*[A-Z]{2})?)/i,
  ];

  for (const pattern of birthPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      // Clean up the result
      let birthplace = match[1].trim();
      // Remove trailing punctuation and HTML
      birthplace = birthplace.replace(/<[^>]+>/g, "").replace(/[<>]/g, "").trim();
      // Remove "us" or "USA" at the end if present
      birthplace = birthplace.replace(/,?\s*(us|usa|united states)$/i, "").trim();
      if (birthplace && birthplace.length > 2 && birthplace.length < 100) {
        console.log(`Found birthplace for player: ${birthplace}`);
        return birthplace;
      }
    }
  }
  return null;
}

// Fetch and parse a single player's page for their history and birthplace
async function fetchPlayerHistory(
  playerName: string,
  playerUrl: string,
  currentSeason: number,
  league: League
): Promise<{ previousSchools: string[]; seasons: { year: string; team: string | null }[]; hometown?: string } | null> {
  try {
    console.log(`Fetching player page for ${playerName}: ${playerUrl}`);
    const html = await fetchSportsRefPage(playerUrl);

    // Extract birthplace directly from HTML (more reliable than AI parsing)
    const hometown = extractBirthplace(html);
    if (hometown) {
      console.log(`Extracted hometown for ${playerName}: ${hometown}`);
    }

    // Extract the relevant stats tables
    const statsTables = extractStatsTables(html);

    console.log(`Extracted ${statsTables.length} chars of stats tables for ${playerName}`);

    // Use Grok to parse the player's history (better at structured extraction)
    const prompt = `Extract this player's year-by-year team history from these sports-reference.com stats tables.

STATS TABLES HTML:
${statsTables}

The "Per Game" or "Totals" table has rows where each row = one season. Look for:
- A "Season" column with years like "2024-25" or "2023-24"
- A "School" or "Team" column showing which team they played for

Example table row structure:
<tr><th>2024-25</th><td><a href="...">Iowa</a></td>...</tr>
<tr><th>2023-24</th><td><a href="...">Drake</a></td>...</tr>

This player transferred if different years show different schools.

Current season: ${currentSeason}

Return JSON only (no markdown):
{
  "previousSchools": ["OldestSchool", "NextSchool"],
  "seasons": [
    {"year": "${currentSeason}", "team": "TEAM_FROM_TABLE"},
    {"year": "${currentSeason - 1}", "team": "TEAM_OR_NULL"},
    {"year": "${currentSeason - 2}", "team": "TEAM_OR_NULL"},
    {"year": "${currentSeason - 3}", "team": "TEAM_OR_NULL"},
    {"year": "${currentSeason - 4}", "team": "TEAM_OR_NULL"}
  ]
}

Rules:
- previousSchools: List schools BEFORE current school (empty [] if no transfers)
- seasons: Use actual team name from table for each year, null if not in table
- Parse the HTML table rows to find the school/team for each season year`;

    // Try Grok first, fall back to Gemini
    let response: string;
    try {
      if (XAI_API_KEY) {
        response = await callGrok(prompt);
      } else {
        response = await callGemini(prompt, false);
      }
    } catch {
      // Fall back to Gemini if Grok fails
      response = await callGemini(prompt, false);
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`Parsed history for ${playerName}:`, JSON.stringify(parsed));
      // Include hometown from birthplace extraction
      return {
        ...parsed,
        hometown,
      };
    }

    // Even if parsing failed, return hometown if we found it
    if (hometown) {
      return {
        previousSchools: [],
        seasons: [],
        hometown,
      };
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
          playerUrl, // Include the player's page URL
          // Use hometown from player page if available, otherwise keep original
          hometown: history.hometown || player.hometown,
          previousSchools: history.previousSchools?.length > 0
            ? history.previousSchools
            : player.previousSchools,
          seasons: history.seasons || player.seasons,
        });
        continue;
      }

      // History fetch failed but we still have the URL
      enrichedPlayers.push({
        ...player,
        playerUrl,
      });
      continue;
    }

    // No URL found - keep original data
    enrichedPlayers.push(player);
  }

  return enrichedPlayers;
}

function getLeagueConfig(league: League) {
  return LEAGUES.find((l) => l.id === league);
}

// Different leagues use different year conventions in their URLs
function getCurrentSeasonYear(league: League): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  switch (league) {
    case "nba":
    case "ncaa-basketball":
      // Basketball uses the ending year (2024-25 season = 2025)
      return month >= 7 ? year + 1 : year;

    case "nfl":
    case "ncaa-football":
      // Football uses the starting year (2024-25 season = 2024)
      // NFL season starts in September (month 8)
      return month >= 8 ? year : year - 1;

    case "mlb":
      // Baseball uses calendar year, season runs April-October
      return year;

    case "nhl":
      // Hockey uses starting year like football (season starts October)
      return month >= 9 ? year : year - 1;

    case "soccer":
    case "euroleague":
      // These don't typically use year in URL
      return year;

    default:
      return month >= 7 ? year + 1 : year;
  }
}

function getSportsRefUrl(league: League, teamSlug: string, year: number): string {
  switch (league) {
    case "nba":
      return `https://www.basketball-reference.com/teams/${teamSlug}/${year}.html`;
    case "ncaa-basketball":
      return `https://www.sports-reference.com/cbb/schools/${teamSlug}/men/${year}.html`;
    case "nfl":
      // NFL roster pages: /teams/nwe/2025_roster.htm
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
    // Atlantic
    "celtics": "BOS",
    "boston celtics": "BOS",
    "boston": "BOS",
    "nets": "BRK",
    "brooklyn nets": "BRK",
    "brooklyn": "BRK",
    "knicks": "NYK",
    "new york knicks": "NYK",
    "76ers": "PHI",
    "philadelphia 76ers": "PHI",
    "sixers": "PHI",
    "philadelphia": "PHI",
    "raptors": "TOR",
    "toronto raptors": "TOR",
    "toronto": "TOR",
    // Central
    "bulls": "CHI",
    "chicago bulls": "CHI",
    "cavaliers": "CLE",
    "cleveland cavaliers": "CLE",
    "cavs": "CLE",
    "cleveland": "CLE",
    "pistons": "DET",
    "detroit pistons": "DET",
    "detroit": "DET",
    "pacers": "IND",
    "indiana pacers": "IND",
    "indiana": "IND",
    "bucks": "MIL",
    "milwaukee bucks": "MIL",
    "milwaukee": "MIL",
    // Southeast
    "hawks": "ATL",
    "atlanta hawks": "ATL",
    "atlanta": "ATL",
    "hornets": "CHO",
    "charlotte hornets": "CHO",
    "charlotte": "CHO",
    "heat": "MIA",
    "miami heat": "MIA",
    "miami": "MIA",
    "magic": "ORL",
    "orlando magic": "ORL",
    "orlando": "ORL",
    "wizards": "WAS",
    "washington wizards": "WAS",
    // Northwest
    "nuggets": "DEN",
    "denver nuggets": "DEN",
    "denver": "DEN",
    "timberwolves": "MIN",
    "minnesota timberwolves": "MIN",
    "wolves": "MIN",
    "thunder": "OKC",
    "oklahoma city thunder": "OKC",
    "oklahoma city": "OKC",
    "okc": "OKC",
    "trail blazers": "POR",
    "portland trail blazers": "POR",
    "blazers": "POR",
    "portland": "POR",
    "jazz": "UTA",
    "utah jazz": "UTA",
    "utah": "UTA",
    // Pacific
    "warriors": "GSW",
    "golden state warriors": "GSW",
    "golden state": "GSW",
    "clippers": "LAC",
    "los angeles clippers": "LAC",
    "la clippers": "LAC",
    "lakers": "LAL",
    "los angeles lakers": "LAL",
    "la lakers": "LAL",
    "suns": "PHO",
    "phoenix suns": "PHO",
    "phoenix": "PHO",
    "kings": "SAC",
    "sacramento kings": "SAC",
    "sacramento": "SAC",
    // Southwest
    "mavericks": "DAL",
    "dallas mavericks": "DAL",
    "mavs": "DAL",
    "dallas": "DAL",
    "rockets": "HOU",
    "houston rockets": "HOU",
    "houston": "HOU",
    "grizzlies": "MEM",
    "memphis grizzlies": "MEM",
    "memphis": "MEM",
    "pelicans": "NOP",
    "new orleans pelicans": "NOP",
    "spurs": "SAS",
    "san antonio spurs": "SAS",
    "san antonio": "SAS",
  },
  "nfl": {
    // AFC East
    "patriots": "nwe",
    "new england patriots": "nwe",
    "new england": "nwe",
    "bills": "buf",
    "buffalo bills": "buf",
    "buffalo": "buf",
    "dolphins": "mia",
    "miami dolphins": "mia",
    "miami": "mia",
    "jets": "nyj",
    "new york jets": "nyj",
    // AFC North
    "ravens": "rav",
    "baltimore ravens": "rav",
    "baltimore": "rav",
    "steelers": "pit",
    "pittsburgh steelers": "pit",
    "pittsburgh": "pit",
    "browns": "cle",
    "cleveland browns": "cle",
    "cleveland": "cle",
    "bengals": "cin",
    "cincinnati bengals": "cin",
    "cincinnati": "cin",
    // AFC South
    "texans": "htx",
    "houston texans": "htx",
    "colts": "clt",
    "indianapolis colts": "clt",
    "indianapolis": "clt",
    "titans": "oti",
    "tennessee titans": "oti",
    "tennessee": "oti",
    "jaguars": "jax",
    "jacksonville jaguars": "jax",
    "jacksonville": "jax",
    // AFC West
    "chiefs": "kan",
    "kansas city chiefs": "kan",
    "kansas city": "kan",
    "broncos": "den",
    "denver broncos": "den",
    "denver": "den",
    "raiders": "rai",
    "las vegas raiders": "rai",
    "las vegas": "rai",
    "chargers": "sdg",
    "los angeles chargers": "sdg",
    "la chargers": "sdg",
    // NFC East
    "eagles": "phi",
    "philadelphia eagles": "phi",
    "philadelphia": "phi",
    "cowboys": "dal",
    "dallas cowboys": "dal",
    "dallas": "dal",
    "giants": "nyg",
    "new york giants": "nyg",
    "commanders": "was",
    "washington commanders": "was",
    "washington": "was",
    // NFC North
    "packers": "gnb",
    "green bay packers": "gnb",
    "green bay": "gnb",
    "lions": "det",
    "detroit lions": "det",
    "detroit": "det",
    "bears": "chi",
    "chicago bears": "chi",
    "chicago": "chi",
    "vikings": "min",
    "minnesota vikings": "min",
    "minnesota": "min",
    // NFC South
    "saints": "nor",
    "new orleans saints": "nor",
    "new orleans": "nor",
    "buccaneers": "tam",
    "bucs": "tam",
    "tampa bay buccaneers": "tam",
    "tampa bay": "tam",
    "falcons": "atl",
    "atlanta falcons": "atl",
    "atlanta": "atl",
    "panthers": "car",
    "carolina panthers": "car",
    "carolina": "car",
    // NFC West
    "seahawks": "sea",
    "seattle seahawks": "sea",
    "seattle": "sea",
    "49ers": "sfo",
    "san francisco 49ers": "sfo",
    "san francisco": "sfo",
    "niners": "sfo",
    "cardinals": "crd",
    "arizona cardinals": "crd",
    "arizona": "crd",
    "rams": "ram",
    "los angeles rams": "ram",
    "la rams": "ram",
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
  "mlb": {
    // AL East
    "yankees": "NYY",
    "new york yankees": "NYY",
    "red sox": "BOS",
    "boston red sox": "BOS",
    "boston": "BOS",
    "rays": "TBR",
    "tampa bay rays": "TBR",
    "tampa bay": "TBR",
    "blue jays": "TOR",
    "toronto blue jays": "TOR",
    "toronto": "TOR",
    "orioles": "BAL",
    "baltimore orioles": "BAL",
    "baltimore": "BAL",
    // AL Central
    "guardians": "CLE",
    "cleveland guardians": "CLE",
    "cleveland": "CLE",
    "twins": "MIN",
    "minnesota twins": "MIN",
    "minnesota": "MIN",
    "white sox": "CHW",
    "chicago white sox": "CHW",
    "tigers": "DET",
    "detroit tigers": "DET",
    "detroit": "DET",
    "royals": "KCR",
    "kansas city royals": "KCR",
    "kansas city": "KCR",
    // AL West
    "astros": "HOU",
    "houston astros": "HOU",
    "houston": "HOU",
    "rangers": "TEX",
    "texas rangers": "TEX",
    "texas": "TEX",
    "mariners": "SEA",
    "seattle mariners": "SEA",
    "seattle": "SEA",
    "angels": "LAA",
    "los angeles angels": "LAA",
    "la angels": "LAA",
    "athletics": "OAK",
    "oakland athletics": "OAK",
    "oakland": "OAK",
    "a's": "OAK",
    // NL East
    "braves": "ATL",
    "atlanta braves": "ATL",
    "atlanta": "ATL",
    "phillies": "PHI",
    "philadelphia phillies": "PHI",
    "philadelphia": "PHI",
    "mets": "NYM",
    "new york mets": "NYM",
    "marlins": "MIA",
    "miami marlins": "MIA",
    "miami": "MIA",
    "nationals": "WSN",
    "washington nationals": "WSN",
    "washington": "WSN",
    // NL Central
    "brewers": "MIL",
    "milwaukee brewers": "MIL",
    "milwaukee": "MIL",
    "cubs": "CHC",
    "chicago cubs": "CHC",
    "chicago": "CHC",
    "cardinals": "STL",
    "st louis cardinals": "STL",
    "st. louis cardinals": "STL",
    "st louis": "STL",
    "reds": "CIN",
    "cincinnati reds": "CIN",
    "cincinnati": "CIN",
    "pirates": "PIT",
    "pittsburgh pirates": "PIT",
    "pittsburgh": "PIT",
    // NL West
    "dodgers": "LAD",
    "los angeles dodgers": "LAD",
    "la dodgers": "LAD",
    "padres": "SDP",
    "san diego padres": "SDP",
    "san diego": "SDP",
    "giants": "SFG",
    "san francisco giants": "SFG",
    "san francisco": "SFG",
    "diamondbacks": "ARI",
    "arizona diamondbacks": "ARI",
    "arizona": "ARI",
    "d-backs": "ARI",
    "rockies": "COL",
    "colorado rockies": "COL",
    "colorado": "COL",
  },
  "nhl": {
    // Atlantic
    "bruins": "BOS",
    "boston bruins": "BOS",
    "boston": "BOS",
    "sabres": "BUF",
    "buffalo sabres": "BUF",
    "buffalo": "BUF",
    "red wings": "DET",
    "detroit red wings": "DET",
    "detroit": "DET",
    "panthers": "FLA",
    "florida panthers": "FLA",
    "florida": "FLA",
    "canadiens": "MTL",
    "montreal canadiens": "MTL",
    "montreal": "MTL",
    "habs": "MTL",
    "senators": "OTT",
    "ottawa senators": "OTT",
    "ottawa": "OTT",
    "lightning": "TBL",
    "tampa bay lightning": "TBL",
    "tampa bay": "TBL",
    "maple leafs": "TOR",
    "toronto maple leafs": "TOR",
    "leafs": "TOR",
    "toronto": "TOR",
    // Metropolitan
    "hurricanes": "CAR",
    "carolina hurricanes": "CAR",
    "carolina": "CAR",
    "blue jackets": "CBJ",
    "columbus blue jackets": "CBJ",
    "columbus": "CBJ",
    "devils": "NJD",
    "new jersey devils": "NJD",
    "new jersey": "NJD",
    "islanders": "NYI",
    "new york islanders": "NYI",
    "rangers": "NYR",
    "new york rangers": "NYR",
    "flyers": "PHI",
    "philadelphia flyers": "PHI",
    "philadelphia": "PHI",
    "penguins": "PIT",
    "pittsburgh penguins": "PIT",
    "pittsburgh": "PIT",
    "capitals": "WSH",
    "washington capitals": "WSH",
    "washington": "WSH",
    // Central
    "coyotes": "ARI",
    "arizona coyotes": "ARI",
    "arizona": "ARI",
    "blackhawks": "CHI",
    "chicago blackhawks": "CHI",
    "chicago": "CHI",
    "avalanche": "COL",
    "colorado avalanche": "COL",
    "colorado": "COL",
    "stars": "DAL",
    "dallas stars": "DAL",
    "dallas": "DAL",
    "wild": "MIN",
    "minnesota wild": "MIN",
    "minnesota": "MIN",
    "predators": "NSH",
    "nashville predators": "NSH",
    "nashville": "NSH",
    "blues": "STL",
    "st louis blues": "STL",
    "st. louis blues": "STL",
    "st louis": "STL",
    "jets": "WPG",
    "winnipeg jets": "WPG",
    "winnipeg": "WPG",
    // Pacific
    "ducks": "ANA",
    "anaheim ducks": "ANA",
    "anaheim": "ANA",
    "flames": "CGY",
    "calgary flames": "CGY",
    "calgary": "CGY",
    "oilers": "EDM",
    "edmonton oilers": "EDM",
    "edmonton": "EDM",
    "kings": "LAK",
    "los angeles kings": "LAK",
    "la kings": "LAK",
    "sharks": "SJS",
    "san jose sharks": "SJS",
    "san jose": "SJS",
    "kraken": "SEA",
    "seattle kraken": "SEA",
    "seattle": "SEA",
    "canucks": "VAN",
    "vancouver canucks": "VAN",
    "vancouver": "VAN",
    "golden knights": "VEG",
    "vegas golden knights": "VEG",
    "vegas": "VEG",
    "knights": "VEG",
  },
  "ncaa-football": {
    // SEC
    "alabama": "alabama",
    "auburn": "auburn",
    "florida": "florida",
    "georgia": "georgia",
    "kentucky": "kentucky",
    "lsu": "louisiana-state",
    "louisiana state": "louisiana-state",
    "mississippi state": "mississippi-state",
    "ole miss": "mississippi",
    "mississippi": "mississippi",
    "missouri": "missouri",
    "south carolina": "south-carolina",
    "tennessee": "tennessee",
    "texas a&m": "texas-am",
    "texas am": "texas-am",
    "vanderbilt": "vanderbilt",
    "arkansas": "arkansas",
    "texas": "texas",
    "oklahoma": "oklahoma",
    // Big Ten
    "ohio state": "ohio-state",
    "osu": "ohio-state",
    "michigan": "michigan",
    "michigan state": "michigan-state",
    "penn state": "penn-state",
    "iowa": "iowa",
    "wisconsin": "wisconsin",
    "minnesota": "minnesota",
    "illinois": "illinois",
    "indiana": "indiana",
    "purdue": "purdue",
    "northwestern": "northwestern",
    "nebraska": "nebraska",
    "maryland": "maryland",
    "rutgers": "rutgers",
    "usc": "southern-california",
    "southern california": "southern-california",
    "ucla": "ucla",
    "oregon": "oregon",
    "washington": "washington",
    // ACC
    "clemson": "clemson",
    "florida state": "florida-state",
    "fsu": "florida-state",
    "miami": "miami-fl",
    "miami fl": "miami-fl",
    "nc state": "north-carolina-state",
    "north carolina state": "north-carolina-state",
    "north carolina": "north-carolina",
    "unc": "north-carolina",
    "duke": "duke",
    "wake forest": "wake-forest",
    "virginia": "virginia",
    "virginia tech": "virginia-tech",
    "pittsburgh": "pittsburgh",
    "pitt": "pittsburgh",
    "louisville": "louisville",
    "boston college": "boston-college",
    "syracuse": "syracuse",
    "georgia tech": "georgia-tech",
    "notre dame": "notre-dame",
    "stanford": "stanford",
    "california": "california",
    "cal": "california",
    "smu": "southern-methodist",
    "southern methodist": "southern-methodist",
    // Big 12
    "baylor": "baylor",
    "tcu": "texas-christian",
    "texas christian": "texas-christian",
    "texas tech": "texas-tech",
    "kansas": "kansas",
    "kansas state": "kansas-state",
    "oklahoma state": "oklahoma-state",
    "west virginia": "west-virginia",
    "iowa state": "iowa-state",
    "byu": "brigham-young",
    "brigham young": "brigham-young",
    "cincinnati": "cincinnati",
    "houston": "houston",
    "ucf": "central-florida",
    "central florida": "central-florida",
    "colorado": "colorado",
    "arizona state": "arizona-state",
    "arizona": "arizona",
    "utah": "utah",
    // Pac-12 (remaining)
    "oregon state": "oregon-state",
    "washington state": "washington-state",
    // Independents & Others
    "army": "army",
    "navy": "navy",
    "air force": "air-force",
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

async function fetchSportsRefPage(url: string, retries = 2): Promise<string> {
  console.log("Fetching sports-reference URL:", url);

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        console.log(`Retry attempt ${attempt} for ${url}`);
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`Fetch failed: ${response.status} ${response.statusText}`);
        console.error(`Response body preview: ${errorText.substring(0, 500)}`);
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}

// Get league-specific prompt for parsing roster tables
function getLeagueRosterPrompt(
  league: League,
  teamQuery: string,
  tableHtml: string,
  currentSeason: number,
  seasonYears: number[]
): string {
  const leagueConfig = getLeagueConfig(league);
  const leagueName = leagueConfig?.name || league;

  // NFL/Pro leagues have different table structure
  if (league === "nfl") {
    return `Parse this HTML roster table from pro-football-reference.com for the ${teamQuery} NFL team.

HTML Table:
${tableHtml}

Extract ALL players from this table. The table has columns: No., Player, Age, Pos, G, GS, Wt, Ht, College/Univ, BirthDate, Yrs, AV, Drafted

For each player, extract:
- Jersey number (from No. column)
- Full name (from Player column)
- Position (from Pos column)
- Height (from Ht column, format as "6-2")
- Weight (from Wt column, just the number)
- Age (actual age number)
- College/University (from College/Univ column - this is where they played college)
- Years in league (from Yrs column)
- Drafted info (from Drafted column, extract the team they were drafted by)

For previousSchools: List all colleges from the College/Univ column (they may have multiple separated by comma).
For hometown: Use the college location as a proxy (e.g., "Alabama" -> "Tuscaloosa, AL").

Also provide:
- Team name: "${teamQuery}" official name (e.g., "New England Patriots")
- Primary color hex code for ${teamQuery}
- Secondary color hex code for ${teamQuery}

For the seasons array, use the Yrs column to determine how many seasons they've played:

Respond with ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "teamName": "New England Patriots",
  "primaryColor": "#002244",
  "secondaryColor": "#C60C30",
  "players": [
    {
      "number": "10",
      "name": "Drake Maye",
      "position": "QB",
      "height": "6-4",
      "weight": "225",
      "age": "23",
      "hometown": "Chapel Hill, NC",
      "highSchool": "",
      "previousSchools": ["North Carolina"],
      "seasons": [
        {"year": "${seasonYears[0]}", "team": "${teamQuery}"},
        {"year": "${seasonYears[1]}", "team": "${teamQuery}"}
      ]
    }
  ]
}

CRITICAL: Extract EVERY player row from the table. Do not skip any players. Return valid JSON only.`;
  }

  if (league === "nba") {
    return `Parse this HTML roster table from basketball-reference.com for the ${teamQuery} NBA team.

HTML Table:
${tableHtml}

Extract ALL players from this table. For each player, extract:
- Jersey number (from No. column)
- Full name (from Player column)
- Position (from Pos column)
- Height (from Ht column, format as "6-2")
- Weight (from Wt column)
- Birth Date
- College (where they played college basketball)

For hometown: Use birthplace if available, otherwise use college location.
For previousSchools: List colleges they attended.

Also provide:
- Team name: "${teamQuery}" official name
- Primary color hex code
- Secondary color hex code

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
      "age": "25",
      "hometown": "City, State",
      "highSchool": "",
      "previousSchools": ["College Name"],
      "seasons": []
    }
  ]
}

CRITICAL: Extract EVERY player row from the table. Return valid JSON only.`;
  }

  // Default prompt for college sports (basketball, football)
  return `Parse this HTML roster table from sports-reference.com for the ${teamQuery} ${leagueName} team.

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
}

// Get roster table patterns for different leagues
function getRosterTablePatterns(league: League): RegExp[] {
  switch (league) {
    case "nfl":
      return [
        /<table[^>]*id="roster"[^>]*>[\s\S]*?<\/table>/i,
        /<table[^>]*id="starters"[^>]*>[\s\S]*?<\/table>/i,
        /<table[^>]*id="team_roster"[^>]*>[\s\S]*?<\/table>/i,
        /<table[^>]*class="[^"]*sortable[^"]*stats_table[^"]*"[^>]*>[\s\S]*?<\/table>/i,
      ];
    case "mlb":
      return [
        /<table[^>]*id="roster"[^>]*>[\s\S]*?<\/table>/i,
        /<table[^>]*id="team_batting"[^>]*>[\s\S]*?<\/table>/i,
        /<table[^>]*id="appearances"[^>]*>[\s\S]*?<\/table>/i,
      ];
    case "nhl":
      return [
        /<table[^>]*id="roster"[^>]*>[\s\S]*?<\/table>/i,
        /<table[^>]*id="skaters"[^>]*>[\s\S]*?<\/table>/i,
      ];
    default:
      return [
        /<table[^>]*id="roster"[^>]*>[\s\S]*?<\/table>/i,
        /<table[^>]*class="[^"]*roster[^"]*"[^>]*>[\s\S]*?<\/table>/i,
      ];
  }
}

export async function fetchTeamRoster(
  league: League,
  teamQuery: string
): Promise<TeamRoster & { fromCache?: boolean }> {
  const currentSeason = getCurrentSeasonYear(league);
  const teamSlug = getTeamSlug(league, teamQuery);

  // Generate cache key for this roster
  const cacheKey = generateCacheKey("roster", league, teamSlug, String(currentSeason));
  const cacheCollection = `rosters_${league}`;

  // Check cache first
  console.log(`Checking cache for ${cacheCollection}/${cacheKey}`);
  const cached = await getCached<TeamRoster>(cacheCollection, cacheKey);
  if (cached) {
    await recordCacheAccess(cacheCollection, cacheKey, true);
    console.log(`Cache HIT for ${teamQuery} - returning cached data`);
    return { ...cached.data, fromCache: true };
  }
  await recordCacheAccess(cacheCollection, cacheKey, false);
  console.log(`Cache MISS for ${teamQuery} - fetching fresh data`);

  const url = getSportsRefUrl(league, teamSlug, currentSeason);
  console.log(`Fetching roster from: ${url}`);

  // Fetch the actual HTML from sports-reference.com
  let htmlContent: string;
  try {
    htmlContent = await fetchSportsRefPage(url);
  } catch (fetchError) {
    console.error("Failed to fetch sports-reference page:", fetchError);
    throw new Error(`Could not find team "${teamQuery}" on sports-reference.com. URL: ${url}. Try using the official team name.`);
  }

  // Extract roster table from the HTML using league-specific patterns
  const tablePatterns = getRosterTablePatterns(league);
  let rosterTableMatch: RegExpMatchArray | null = null;

  for (const pattern of tablePatterns) {
    rosterTableMatch = htmlContent.match(pattern);
    if (rosterTableMatch) {
      console.log(`Found roster table with pattern: ${pattern.source.substring(0, 50)}...`);
      break;
    }
  }

  if (!rosterTableMatch) {
    // Log available table IDs for debugging
    const tableIds = htmlContent.match(/id="[^"]+"/g)?.slice(0, 20) || [];
    console.error(`No roster table found. Available IDs: ${tableIds.join(", ")}`);
    throw new Error(`Could not find roster table on the page for ${league}. The team page may have a different structure.`);
  }

  const tableHtml = rosterTableMatch[0];

  // Limit table size to avoid overwhelming the AI (NFL tables can be huge)
  const maxTableSize = 50000;
  const truncatedTableHtml = tableHtml.length > maxTableSize
    ? tableHtml.substring(0, maxTableSize) + "<!-- truncated -->"
    : tableHtml;
  console.log(`Table HTML size: ${tableHtml.length} chars (${truncatedTableHtml.length} after truncation)`);

  const seasonYears = [
    currentSeason,
    currentSeason - 1,
    currentSeason - 2,
    currentSeason - 3,
    currentSeason - 4,
  ];

  // Use league-specific prompts for parsing roster tables
  const prompt = getLeagueRosterPrompt(league, teamQuery, truncatedTableHtml, currentSeason, seasonYears);

  console.log(`Sending prompt to Gemini (${prompt.length} chars)...`);
  const responseText = await callGemini(prompt);
  console.log(`Gemini response length: ${responseText.length} chars`);
  console.log(`Gemini response preview: ${responseText.substring(0, 500)}...`);

  // Parse the JSON response
  let rosterData;
  try {
    // Strip markdown code blocks if present
    let cleanedResponse = responseText;
    if (responseText.includes("```")) {
      // Remove ```json or ``` wrappers
      cleanedResponse = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      console.log("Stripped markdown code blocks from response");
    }

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response. Full response:", responseText);
      throw new Error("No JSON found in response");
    }
    rosterData = JSON.parse(jsonMatch[0]);
    console.log(`Parsed ${rosterData.players?.length || 0} players from Gemini response`);
  } catch (parseError) {
    console.error("Failed to parse roster response. Error:", parseError);
    console.error("Response text:", responseText.substring(0, 2000));
    throw new Error(`Failed to parse roster data from AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
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

  const roster: TeamRoster = {
    teamName: rosterData.teamName,
    league,
    primaryColor: rosterData.primaryColor || "#00bcd4",
    secondaryColor: rosterData.secondaryColor || "#ffffff",
    players: playersWithCoords,
    season: String(currentSeason),
  };

  // Cache the roster data in Firestore (different TTL for college vs pro)
  const ttlHours = getRosterTTL(league);
  console.log(`Caching roster for ${teamQuery} with TTL ${ttlHours} hours (${ttlHours / 24} days)`);
  await setCache(cacheCollection, cacheKey, roster, ttlHours);

  return { ...roster, fromCache: false };
}
