// Spotify cookie-based authentication (fallback when OAuth unavailable)
// Uses sp_dc cookie to access Spotify Web API

const SPOTIFY_DC = process.env.SPOTIFY_DC;

interface SpotifyWebAPIResponse {
  ok: boolean;
  status: number;
  data?: any;
}

async function spotifyFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<SpotifyWebAPIResponse> {
  if (!SPOTIFY_DC) {
    throw new Error("SPOTIFY_DC cookie not configured");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      Cookie: `sp_dc=${SPOTIFY_DC}`,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      ...options.headers,
    },
  });

  return {
    ok: response.ok || response.status === 204,
    status: response.status,
    data: response.status === 204 ? null : await response.json().catch(() => null),
  };
}

// Get current playback state
export async function getPlaybackStateCookie() {
  const result = await spotifyFetch("https://api.spotify.com/v1/me/player");
  return result.data;
}

// Play
export async function playCookie(contextUri?: string, uris?: string[]) {
  const body: any = {};
  if (contextUri) body.context_uri = contextUri;
  if (uris) body.uris = uris;

  return await spotifyFetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
}

// Pause
export async function pauseCookie() {
  return await spotifyFetch("https://api.spotify.com/v1/me/player/pause", {
    method: "PUT",
  });
}

// Skip to next track
export async function skipToNextCookie() {
  return await spotifyFetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
  });
}

// Skip to previous track
export async function skipToPreviousCookie() {
  return await spotifyFetch("https://api.spotify.com/v1/me/player/previous", {
    method: "POST",
  });
}

// Set volume (0-100)
export async function setVolumeCookie(volume: number) {
  return await spotifyFetch(
    `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`,
    { method: "PUT" }
  );
}

// Set shuffle
export async function setShuffleCookie(state: boolean) {
  return await spotifyFetch(
    `https://api.spotify.com/v1/me/player/shuffle?state=${state}`,
    { method: "PUT" }
  );
}

// Set repeat mode
export async function setRepeatCookie(state: "off" | "track" | "context") {
  return await spotifyFetch(
    `https://api.spotify.com/v1/me/player/repeat?state=${state}`,
    { method: "PUT" }
  );
}

// Seek to position
export async function seekCookie(positionMs: number) {
  return await spotifyFetch(
    `https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`,
    { method: "PUT" }
  );
}

// Get available devices
export async function getDevicesCookie() {
  const result = await spotifyFetch("https://api.spotify.com/v1/me/player/devices");
  return result.data?.devices || [];
}

// Transfer playback to device
export async function transferPlaybackCookie(deviceId: string, play = true) {
  return await spotifyFetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_ids: [deviceId], play }),
  });
}

// Get user's playlists
export async function getPlaylistsCookie(limit = 20) {
  const result = await spotifyFetch(
    `https://api.spotify.com/v1/me/playlists?limit=${limit}`
  );
  return result.data?.items || [];
}

// Search tracks
export async function searchTracksCookie(query: string, limit = 20) {
  const result = await spotifyFetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
  );
  return result.data?.tracks?.items || [];
}
