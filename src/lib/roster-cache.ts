import { getCached, setCache, CACHE_TTL, generateCacheKey } from "./firestore-cache";
import { getAdminFirestore } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { TeamRoster, League } from "@/types/roster";

// Collection names
const ROSTERS_COLLECTION = "rosters";
const RECENT_ROSTERS_COLLECTION = "recent_rosters";

// Helper to get roster TTL based on league type
function getRosterTTL(league: League): number {
  const collegeLeagues: League[] = ["college"];
  return collegeLeagues.includes(league) ? CACHE_TTL.collegeRoster : CACHE_TTL.proRoster;
}

// Generate a cache key for a roster
export function generateRosterKey(league: League, teamName: string): string {
  return generateCacheKey(league, teamName);
}

// Get cached roster
export async function getCachedRoster(
  league: League,
  teamName: string
): Promise<{ roster: TeamRoster; fromCache: boolean } | null> {
  const key = generateRosterKey(league, teamName);
  const result = await getCached<TeamRoster>(ROSTERS_COLLECTION, key);

  if (result) {
    return { roster: result.data, fromCache: result.fromCache };
  }
  return null;
}

// Cache a roster
export async function cacheRoster(
  league: League,
  teamName: string,
  roster: TeamRoster
): Promise<boolean> {
  const key = generateRosterKey(league, teamName);
  const ttl = getRosterTTL(league);
  const success = await setCache(ROSTERS_COLLECTION, key, roster, ttl);

  // Also record this as a recent search
  if (success) {
    await recordRecentRoster(league, teamName, roster);
  }

  return success;
}

// Record a recent roster search
export async function recordRecentRoster(
  league: League,
  teamName: string,
  roster: TeamRoster
): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;

  try {
    const key = generateRosterKey(league, teamName);
    const docRef = db.collection(RECENT_ROSTERS_COLLECTION).doc(key);

    await docRef.set({
      league,
      teamName: roster.teamName,
      leagueName: roster.leagueName,
      primaryColor: roster.primaryColor,
      secondaryColor: roster.secondaryColor,
      season: roster.season,
      playerCount: roster.players.length,
      logoUrl: roster.profile?.logoUrl || null,
      record: roster.profile ? `${roster.profile.stats.wins}-${roster.profile.stats.losses}` : null,
      searchedAt: Timestamp.now(),
      cacheKey: key,
    }, { merge: true });
  } catch (error) {
    console.error("Error recording recent roster:", error);
  }
}

// Get recently searched rosters
export interface RecentRoster {
  league: League;
  teamName: string;
  leagueName: string;
  primaryColor: string;
  secondaryColor: string;
  season: string;
  playerCount: number;
  logoUrl: string | null;
  record: string | null;
  searchedAt: Date;
  cacheKey: string;
}

export async function getRecentRosters(limit: number = 10): Promise<RecentRoster[]> {
  const db = getAdminFirestore();
  if (!db) {
    console.log("Firestore not available");
    return [];
  }

  try {
    const snapshot = await db
      .collection(RECENT_ROSTERS_COLLECTION)
      .orderBy("searchedAt", "desc")
      .limit(limit)
      .get();

    const rosters: RecentRoster[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      rosters.push({
        league: data.league,
        teamName: data.teamName,
        leagueName: data.leagueName,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        season: data.season,
        playerCount: data.playerCount,
        logoUrl: data.logoUrl,
        record: data.record,
        searchedAt: data.searchedAt.toDate(),
        cacheKey: data.cacheKey,
      });
    });

    return rosters;
  } catch (error) {
    console.error("Error fetching recent rosters:", error);
    return [];
  }
}
