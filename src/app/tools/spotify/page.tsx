"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Loader2,
  MonitorSpeaker,
  ListMusic,
  Search,
  Plus,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface SpotifyTrack {
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

interface SpotifyPlaybackState {
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

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  uri: string;
}

export default function SpotifyPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [playback, setPlayback] = useState<SpotifyPlaybackState | null>(null);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"player" | "playlists" | "search">("player");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/spotify/status");
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      return data.authenticated;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Fetch playback state
  const fetchPlayback = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify/player");
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await response.json();
      setPlayback(data.playback);
      setDevices(data.devices || []);
      if (data.playback?.progress_ms !== undefined) {
        setLocalProgress(data.playback.progress_ms);
      }
    } catch (err) {
      console.error("Error fetching playback:", err);
    }
  }, []);

  // Fetch playlists
  const fetchPlaylists = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify/playlists");
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error("Error fetching playlists:", err);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const authenticated = await checkAuth();
      if (authenticated) {
        await Promise.all([fetchPlayback(), fetchPlaylists()]);
      }
      setIsLoading(false);
    };
    init();
  }, [checkAuth, fetchPlayback, fetchPlaylists]);

  // Refresh playback state periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(fetchPlayback, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchPlayback]);

  // Update local progress while playing
  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    if (playback?.is_playing) {
      progressInterval.current = setInterval(() => {
        setLocalProgress((prev) => prev + 1000);
      }, 1000);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [playback?.is_playing]);

  // Player control actions
  const playerAction = async (action: string, params: Record<string, unknown> = {}) => {
    try {
      const response = await fetch("/api/spotify/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }
      // Refresh playback after action
      setTimeout(fetchPlayback, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Search for tracks
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=track`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.tracks?.items || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Add track to queue
  const addToQueue = async (uri: string) => {
    try {
      const response = await fetch("/api/spotify/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri }),
      });
      if (!response.ok) {
        throw new Error("Failed to add to queue");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to queue");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Play a playlist
  const playPlaylist = async (uri: string) => {
    await playerAction("play", { context_uri: uri });
  };

  // Login handler
  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/spotify");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Failed to start authentication");
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/auth/spotify/status", { method: "DELETE" });
    setIsAuthenticated(false);
    setPlayback(null);
    setPlaylists([]);
  };

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get album art URL
  const getAlbumArt = (track: SpotifyTrack | null) => {
    if (!track?.album?.images?.length) return null;
    return track.album.images[0]?.url;
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
        <Header />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "64px" }}>
          <Loader2 style={{ width: "40px", height: "40px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
        <Header />
        <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
          <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto", padding: "32px 24px" }}>
            <RemindersBanner />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ marginBottom: "32px" }}
            >
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  color: "var(--foreground-muted)",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                <ArrowLeft style={{ width: "16px", height: "16px" }} />
                <span>Back to Dashboard</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                borderRadius: "20px",
                padding: "48px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #1DB954, #1ed760)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Music style={{ width: "40px", height: "40px", color: "#000" }} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "12px" }}>
                Connect to Spotify
              </h1>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "32px", lineHeight: 1.6 }}>
                Link your Spotify Premium account to control playback, browse playlists, and search for music.
              </p>
              <button
                onClick={handleLogin}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 28px",
                  borderRadius: "50px",
                  border: "none",
                  background: "linear-gradient(135deg, #1DB954, #1ed760)",
                  color: "#000",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Music style={{ width: "20px", height: "20px" }} />
                Connect with Spotify
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", padding: "32px 24px 100px 24px" }}>
          <RemindersBanner />
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid var(--glass-border)",
                backgroundColor: "transparent",
                color: "var(--foreground-muted)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Disconnect
            </button>
          </motion.div>

          {/* Error Toast */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: "fixed",
                top: "100px",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "12px 24px",
                borderRadius: "8px",
                backgroundColor: "#f87171",
                color: "#fff",
                fontSize: "14px",
                zIndex: 1000,
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Now Playing Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{ borderRadius: "24px", overflow: "hidden", marginBottom: "24px" }}
          >
            {/* Album Art & Track Info */}
            <div style={{ display: "flex", gap: "24px", padding: "24px" }}>
              {/* Album Art */}
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {playback?.item && getAlbumArt(playback.item) ? (
                  <img
                    src={getAlbumArt(playback.item)!}
                    alt={playback.item.album.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Music style={{ width: "48px", height: "48px", color: "var(--foreground-muted)" }} />
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                {playback?.item ? (
                  <>
                    <h2
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "var(--foreground)",
                        marginBottom: "8px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {playback.item.name}
                    </h2>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "var(--foreground-muted)",
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {playback.item.artists.map((a) => a.name).join(", ")}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--foreground-muted)",
                        opacity: 0.7,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {playback.item.album.name}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "16px", color: "var(--foreground-muted)" }}>
                    No track playing
                  </p>
                )}

                {/* Device Info */}
                {playback?.device && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                    <MonitorSpeaker style={{ width: "14px", height: "14px", color: "#1DB954" }} />
                    <span style={{ fontSize: "12px", color: "#1DB954" }}>
                      {playback.device.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ padding: "0 24px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--foreground-muted)", width: "40px" }}>
                  {formatTime(localProgress)}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "6px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "3px",
                    cursor: playback?.item ? "pointer" : "default",
                    overflow: "hidden",
                  }}
                  onClick={(e) => {
                    if (!playback?.item) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    const position = Math.round(percent * playback.item.duration_ms);
                    setLocalProgress(position);
                    playerAction("seek", { position_ms: position });
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${playback?.item ? (localProgress / playback.item.duration_ms) * 100 : 0}%`,
                      backgroundColor: "#1DB954",
                      borderRadius: "3px",
                      transition: "width 0.1s linear",
                    }}
                  />
                </div>
                <span style={{ fontSize: "12px", color: "var(--foreground-muted)", width: "40px", textAlign: "right" }}>
                  {playback?.item ? formatTime(playback.item.duration_ms) : "0:00"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ padding: "0 24px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
              {/* Shuffle */}
              <button
                onClick={() => playerAction("shuffle", { state: !playback?.shuffle_state })}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "transparent",
                  color: playback?.shuffle_state ? "#1DB954" : "var(--foreground-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shuffle style={{ width: "20px", height: "20px" }} />
              </button>

              {/* Previous */}
              <button
                onClick={() => playerAction("previous")}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SkipBack style={{ width: "24px", height: "24px" }} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={() => playerAction(playback?.is_playing ? "pause" : "play")}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#1DB954",
                  color: "#000",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {playback?.is_playing ? (
                  <Pause style={{ width: "28px", height: "28px" }} />
                ) : (
                  <Play style={{ width: "28px", height: "28px", marginLeft: "3px" }} />
                )}
              </button>

              {/* Next */}
              <button
                onClick={() => playerAction("next")}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SkipForward style={{ width: "24px", height: "24px" }} />
              </button>

              {/* Repeat */}
              <button
                onClick={() => {
                  const states: ("off" | "context" | "track")[] = ["off", "context", "track"];
                  const currentIndex = states.indexOf(playback?.repeat_state || "off");
                  const nextState = states[(currentIndex + 1) % 3];
                  playerAction("repeat", { state: nextState });
                }}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "transparent",
                  color: playback?.repeat_state !== "off" ? "#1DB954" : "var(--foreground-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {playback?.repeat_state === "track" ? (
                  <Repeat1 style={{ width: "20px", height: "20px" }} />
                ) : (
                  <Repeat style={{ width: "20px", height: "20px" }} />
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div style={{ padding: "0 24px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <button
                onClick={() => playerAction("volume", { volume: 0 })}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--foreground-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <VolumeX style={{ width: "18px", height: "18px" }} />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={playback?.device?.volume_percent || 0}
                onChange={(e) => playerAction("volume", { volume: parseInt(e.target.value) })}
                style={{
                  width: "150px",
                  accentColor: "#1DB954",
                }}
              />
              <button
                onClick={() => playerAction("volume", { volume: 100 })}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--foreground-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <Volume2 style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
          </motion.div>

          {/* Device Selector */}
          {devices.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass"
              style={{ borderRadius: "16px", padding: "16px", marginBottom: "24px" }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                Devices
              </h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => playerAction("transfer", { device_id: device.id, play: true })}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: device.is_active ? "2px solid #1DB954" : "1px solid var(--glass-border)",
                      backgroundColor: device.is_active ? "rgba(29, 185, 84, 0.1)" : "transparent",
                      color: device.is_active ? "#1DB954" : "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MonitorSpeaker style={{ width: "14px", height: "14px" }} />
                    {device.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass"
            style={{ display: "flex", gap: "8px", padding: "8px", borderRadius: "12px", marginBottom: "16px", width: "fit-content" }}
          >
            <button
              onClick={() => setActiveTab("playlists")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "playlists" ? "#1DB954" : "transparent",
                color: activeTab === "playlists" ? "#000" : "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ListMusic style={{ width: "16px", height: "16px" }} />
              Playlists
            </button>
            <button
              onClick={() => setActiveTab("search")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "search" ? "#1DB954" : "transparent",
                color: activeTab === "search" ? "#000" : "var(--foreground-muted)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Search style={{ width: "16px", height: "16px" }} />
              Search
            </button>
          </motion.div>

          {/* Playlists Tab */}
          {activeTab === "playlists" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}
            >
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  onClick={() => playPlaylist(playlist.uri)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ aspectRatio: "1", backgroundColor: "rgba(255,255,255,0.1)" }}>
                    {playlist.images?.[0]?.url ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ListMusic style={{ width: "32px", height: "32px", color: "var(--foreground-muted)" }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px" }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {playlist.name}
                    </h4>
                    <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                      {playlist.tracks.total} tracks
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Search Tab */}
          {activeTab === "search" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Search Input */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <div className="glass" style={{ flex: 1, borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <Search style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search for songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      color: "var(--foreground)",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#1DB954",
                    color: "#000",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: isSearching ? "not-allowed" : "pointer",
                    opacity: isSearching ? 0.5 : 1,
                  }}
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Search Results */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="glass"
                    style={{
                      borderRadius: "10px",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "6px",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      {getAlbumArt(track) ? (
                        <img src={getAlbumArt(track)!} alt={track.album.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Music style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {track.name}
                      </h4>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--foreground-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => addToQueue(track.uri)}
                        title="Add to queue"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          border: "1px solid var(--glass-border)",
                          backgroundColor: "transparent",
                          color: "var(--foreground-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus style={{ width: "18px", height: "18px" }} />
                      </button>
                      <button
                        onClick={() => playerAction("play", { uris: [track.uri] })}
                        title="Play now"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          border: "none",
                          backgroundColor: "#1DB954",
                          color: "#000",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Play style={{ width: "16px", height: "16px", marginLeft: "2px" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="glass" style={{ borderRadius: "12px", padding: "40px", textAlign: "center" }}>
                  <Search style={{ width: "40px", height: "40px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>No results found for &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Open in Spotify */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: "32px", textAlign: "center" }}
          >
            <a
              href="https://open.spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open Spotify
            </a>
          </motion.div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
