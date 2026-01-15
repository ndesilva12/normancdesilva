export type League =
  | "nba"
  | "ncaa-basketball"
  | "nfl"
  | "ncaa-football"
  | "mlb"
  | "nhl"
  | "soccer"
  | "euroleague";

export interface LeagueOption {
  id: League;
  name: string;
  sportsRefPath: string;
  baseUrl: string;
}

export const LEAGUES: LeagueOption[] = [
  { id: "nba", name: "NBA", sportsRefPath: "teams", baseUrl: "https://www.basketball-reference.com" },
  { id: "ncaa-basketball", name: "NCAA Basketball", sportsRefPath: "cbb/schools", baseUrl: "https://www.sports-reference.com" },
  { id: "nfl", name: "NFL", sportsRefPath: "teams", baseUrl: "https://www.pro-football-reference.com" },
  { id: "ncaa-football", name: "NCAA Football", sportsRefPath: "cfb/schools", baseUrl: "https://www.sports-reference.com" },
  { id: "mlb", name: "MLB", sportsRefPath: "teams", baseUrl: "https://www.baseball-reference.com" },
  { id: "nhl", name: "NHL", sportsRefPath: "teams", baseUrl: "https://www.hockey-reference.com" },
  { id: "soccer", name: "Soccer", sportsRefPath: "squads", baseUrl: "https://fbref.com" },
  { id: "euroleague", name: "Euroleague Basketball", sportsRefPath: "teams", baseUrl: "https://www.eurobasket.com" },
];

export interface Player {
  number: string;
  name: string;
  position: string;
  height: string;
  weight: string;
  age: string;
  hometown: string;
  highSchool: string;
  previousSchools: string[];
  // Last 5 seasons: team name or null if not playing
  seasons: {
    year: string;
    team: string | null;
  }[];
  // For mapping
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Link to player's sports-reference page
  playerUrl?: string;
}

export interface TeamRoster {
  teamName: string;
  league: League;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  season: string;
}

export interface RosterSearchResult {
  roster: TeamRoster;
  cached?: boolean;
}
