import { TeamRoster, League } from "@/types/roster";

// Simple in-memory cache for roster data
// In production, you might want to use Redis or similar
const rosterCache = new Map<string, { data: TeamRoster; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getCacheKey(league: League, teamQuery: string): string {
  return `${league}:${teamQuery.toLowerCase().trim()}`;
}

export function getCachedRoster(league: League, teamQuery: string): TeamRoster | null {
  const key = getCacheKey(league, teamQuery);
  const cached = rosterCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache has expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    rosterCache.delete(key);
    return null;
  }

  return cached.data;
}

export function cacheRoster(league: League, teamQuery: string, roster: TeamRoster): void {
  const key = getCacheKey(league, teamQuery);
  rosterCache.set(key, {
    data: roster,
    timestamp: Date.now(),
  });
}

export function clearRosterCache(): void {
  rosterCache.clear();
}
