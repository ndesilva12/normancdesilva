// Simplified roster types for basketball only
export type League = "nba" | "college" | "international";

export interface LeagueOption {
  id: League;
  name: string;
  description: string;
}

export const LEAGUES: LeagueOption[] = [
  {
    id: "nba",
    name: "NBA",
    description: "National Basketball Association"
  },
  {
    id: "college",
    name: "College Basketball",
    description: "NCAA Men's Basketball"
  },
  {
    id: "international",
    name: "International Basketball",
    description: "EuroLeague, FIBA, and other international leagues"
  },
];

// Basic player stats (3-5 key stats)
export interface PlayerStats {
  gamesPlayed: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  minutesPerGame?: number;
}

// Prior team history
export interface TeamHistory {
  team: string;
  league: string;
  years: string; // e.g., "2022-2024"
}

export interface Player {
  number: string;
  name: string;
  position: string;
  height: string;
  weight: string;
  age: string;
  hometown: string;
  country?: string;
  // Current season stats
  stats: PlayerStats;
  // Prior team history
  priorTeams: TeamHistory[];
  // For mapping
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Coach information
export interface Coach {
  name: string;
  role: string; // e.g., "Head Coach", "Assistant Coach"
  yearsWithTeam?: number;
}

// Team statistics
export interface TeamStats {
  wins: number;
  losses: number;
  winPercentage: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  reboundsPerGame?: number;
  assistsPerGame?: number;
  conferenceRank?: number;
  overallRank?: number;
}

// Team profile
export interface TeamProfile {
  logoUrl?: string;
  founded?: string;
  arena: string;
  city: string;
  state?: string;
  country: string;
  championships?: number;
  coaches: Coach[];
  stats: TeamStats;
  recentResults?: string[]; // e.g., ["W vs Lakers 110-105", "L vs Celtics 98-102"]
}

export interface TeamRoster {
  teamName: string;
  league: League;
  leagueName: string; // e.g., "NBA", "Big Ten", "EuroLeague"
  conference?: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  season: string;
  profile?: TeamProfile;
}
