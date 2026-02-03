"use client";

import { useState, useEffect } from "react";
import { Music, Play, Pause, SkipBack, SkipForward, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

interface SpotifyPlayback {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
}

export function SpotifyPreview() {
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPlayback();
    const interval = setInterval(fetchPlayback, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchPlayback = async () => {
    try {
      const response = await fetch("/api/spotify/player-cookie");
      if (!response.ok) throw new Error("Failed to fetch playback");
      const data = await response.json();
      setPlayback(data.playback);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleControl = async (action: string) => {
    try {
      await fetch("/api/spotify/player-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setTimeout(fetchPlayback, 300);
    } catch (err) {
      console.error("Control error:", err);
    }
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          cursor: "pointer",
        }}
        onClick={() => router.push("/tools/spotify")}
      >
        <Music style={{ width: "18px", height: "18px", color: "#1DB954" }} />
        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", flex: 1 }}>
          Spotify
        </span>
        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "var(--foreground-muted)",
          }}
          title="Open Spotify"
        >
          <ExternalLink style={{ width: "12px", height: "12px" }} />
        </a>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <Loader2 style={{ width: "24px", height: "24px", color: "#1DB954", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
            {error}
          </div>
        ) : !playback?.item ? (
          <div style={{ textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
            No track playing
          </div>
        ) : (
          <>
            {/* Album Art & Track Info */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {playback.item.album.images[0] && (
                <img
                  src={playback.item.album.images[0].url}
                  alt=""
                  style={{ width: "56px", height: "56px", borderRadius: "6px" }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {playback.item.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--foreground-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {playback.item.artists.map((a) => a.name).join(", ")}
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl("previous");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                <SkipBack style={{ width: "16px", height: "16px" }} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl(playback.is_playing ? "pause" : "play");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#1DB954",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                {playback.is_playing ? (
                  <Pause style={{ width: "18px", height: "18px" }} />
                ) : (
                  <Play style={{ width: "18px", height: "18px", marginLeft: "2px" }} />
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl("next");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                <SkipForward style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
