// Spotify OAuth and API utilities

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3000/api/auth/spotify/callback";

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-recently-played",
  "user-library-read",
];

export interface SpotifyTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  uri: string;
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  } | null;
  shuffle_state: boolean;
  repeat_state: "off" | "track" | "context";
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  uri: string;
}

// Generate OAuth URL for user authorization
export function getSpotifyAuthUrl(): string {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error("Spotify Client ID not configured");
  }

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    show_dialog: "true",
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify OAuth credentials not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify OAuth credentials not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// Get current playback state
export async function getPlaybackState(accessToken: string): Promise<SpotifyPlaybackState | null> {
  const response = await fetch("https://api.spotify.com/v1/me/player", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204) {
    return null; // No active playback
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get playback state: ${error}`);
  }

  return response.json();
}

// Play/Resume playback
export async function play(accessToken: string, options?: { context_uri?: string; uris?: string[]; device_id?: string }): Promise<void> {
  const url = new URL("https://api.spotify.com/v1/me/player/play");
  if (options?.device_id) {
    url.searchParams.set("device_id", options.device_id);
  }

  const body: Record<string, unknown> = {};
  if (options?.context_uri) body.context_uri = options.context_uri;
  if (options?.uris) body.uris = options.uris;

  const response = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to play: ${error}`);
  }
}

// Pause playback
export async function pause(accessToken: string): Promise<void> {
  const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to pause: ${error}`);
  }
}

// Skip to next track
export async function skipToNext(accessToken: string): Promise<void> {
  const response = await fetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to skip to next: ${error}`);
  }
}

// Skip to previous track
export async function skipToPrevious(accessToken: string): Promise<void> {
  const response = await fetch("https://api.spotify.com/v1/me/player/previous", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to skip to previous: ${error}`);
  }
}

// Set volume
export async function setVolume(accessToken: string, volumePercent: number): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(volumePercent)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to set volume: ${error}`);
  }
}

// Toggle shuffle
export async function setShuffle(accessToken: string, state: boolean): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/shuffle?state=${state}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to set shuffle: ${error}`);
  }
}

// Set repeat mode
export async function setRepeat(accessToken: string, state: "off" | "track" | "context"): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/repeat?state=${state}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to set repeat: ${error}`);
  }
}

// Seek to position
export async function seek(accessToken: string, positionMs: number): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to seek: ${error}`);
  }
}

// Get user's playlists
export async function getPlaylists(accessToken: string, limit = 20): Promise<SpotifyPlaylist[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get playlists: ${error}`);
  }

  const data = await response.json();
  return data.items;
}

// Get available devices
export async function getDevices(accessToken: string): Promise<{ id: string; name: string; type: string; is_active: boolean; volume_percent: number }[]> {
  const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get devices: ${error}`);
  }

  const data = await response.json();
  return data.devices;
}

// Transfer playback to a device
export async function transferPlayback(accessToken: string, deviceId: string, play = false): Promise<void> {
  const response = await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play,
    }),
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to transfer playback: ${error}`);
  }
}

// Add track to queue
export async function addToQueue(accessToken: string, uri: string): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to add to queue: ${error}`);
  }
}

// Search for tracks
export async function search(
  accessToken: string,
  query: string,
  types: ("track" | "album" | "artist" | "playlist")[] = ["track"],
  limit = 10
): Promise<{ tracks?: { items: SpotifyTrack[] }; albums?: { items: unknown[] }; artists?: { items: unknown[] }; playlists?: { items: SpotifyPlaylist[] } }> {
  const params = new URLSearchParams({
    q: query,
    type: types.join(","),
    limit: limit.toString(),
  });

  const response = await fetch(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to search: ${error}`);
  }

  return response.json();
}
