export type League =
  | "nba"
  | "ncaa-basketball"
  | "nfl"
  | "ncaa-football"
  | "mlb"
  | "nhl";

export interface LeagueOption {
  id: League;
  name: string;
  sportsRefPath: string;
}

export const LEAGUES: LeagueOption[] = [
  { id: "nba", name: "NBA", sportsRefPath: "basketball" },
  { id: "ncaa-basketball", name: "NCAA Basketball", sportsRefPath: "cbb" },
  { id: "nfl", name: "NFL", sportsRefPath: "football" },
  { id: "ncaa-football", name: "NCAA Football", sportsRefPath: "cfb" },
  { id: "mlb", name: "MLB", sportsRefPath: "baseball" },
  { id: "nhl", name: "NHL", sportsRefPath: "hockey" },
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
