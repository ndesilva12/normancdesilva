"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Users, MapPin, Loader2, ChevronDown, Trophy, History } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { League, LEAGUES, TeamRoster, Player } from "@/types/roster";

// Dark map styles
const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6e7681" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#21262d" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#161b22" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#010409" }] },
];

// Roster Table Component
function RosterTable({
  roster,
  highlightedPlayer,
  onPlayerHover,
}: {
  roster: TeamRoster;
  highlightedPlayer: string | null;
  onPlayerHover: (playerName: string | null) => void;
}) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Team Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: roster.primaryColor,
            border: `3px solid ${roster.secondaryColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trophy style={{ width: "24px", height: "24px", color: roster.secondaryColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)" }}>
            {roster.teamName}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
            {roster.leagueName} • {roster.season} Season • {roster.players.length} players
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <th style={thStyle}>#</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Player</th>
              <th style={thStyle}>Pos</th>
              <th style={thStyle}>Ht</th>
              <th style={thStyle}>Age</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Hometown</th>
              <th style={thStyle}>PPG</th>
              <th style={thStyle}>RPG</th>
              <th style={thStyle}>APG</th>
              <th style={thStyle}>GP</th>
            </tr>
          </thead>
          <tbody>
            {roster.players.map((player, index) => (
              <>
                <tr
                  key={`${player.name}-${index}`}
                  onMouseEnter={() => onPlayerHover(player.name)}
                  onMouseLeave={() => onPlayerHover(null)}
                  onClick={() => setExpandedPlayer(expandedPlayer === player.name ? null : player.name)}
                  style={{
                    backgroundColor:
                      highlightedPlayer === player.name
                        ? `${roster.primaryColor}22`
                        : index % 2 === 0
                        ? "transparent"
                        : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                  }}
                >
                  <td style={tdStyle}>{player.number || "-"}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, textAlign: "left" }}>
                    {player.name}
                  </td>
                  <td style={tdStyle}>{player.position}</td>
                  <td style={tdStyle}>{player.height}</td>
                  <td style={tdStyle}>{player.age}</td>
                  <td style={{ ...tdStyle, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {player.coordinates && (
                        <MapPin
                          style={{
                            width: "12px",
                            height: "12px",
                            color: roster.primaryColor,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span style={{ fontSize: "12px" }}>{player.hometown || "N/A"}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "var(--accent)" }}>
                    {player.stats?.pointsPerGame?.toFixed(1) || "0.0"}
                  </td>
                  <td style={tdStyle}>
                    {player.stats?.reboundsPerGame?.toFixed(1) || "0.0"}
                  </td>
                  <td style={tdStyle}>
                    {player.stats?.assistsPerGame?.toFixed(1) || "0.0"}
                  </td>
                  <td style={tdStyle}>{player.stats?.gamesPlayed || 0}</td>
                </tr>

                {/* Expanded row for prior teams */}
                {expandedPlayer === player.name && player.priorTeams && player.priorTeams.length > 0 && (
                  <tr key={`${player.name}-history`}>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <div
                        style={{
                          padding: "12px 20px",
                          backgroundColor: "rgba(var(--accent-rgb), 0.05)",
                          borderBottom: "1px solid var(--glass-border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <History style={{ width: "14px", height: "14px", color: "var(--accent)" }} />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground)" }}>
                            Prior Team History
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {player.priorTeams.map((team, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                borderRadius: "6px",
                                fontSize: "12px",
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
                                {team.team}
                              </span>
                              <span style={{ color: "var(--foreground-muted)", marginLeft: "6px" }}>
                                {team.league} • {team.years}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "center",
  fontWeight: 600,
  color: "var(--foreground-muted)",
  borderBottom: "1px solid var(--glass-border)",
  whiteSpace: "nowrap",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "center",
  color: "var(--foreground)",
  borderBottom: "1px solid var(--glass-border)",
};

// Map Component
function PlayerMap({
  roster,
  highlightedPlayer,
  onPlayerHover,
}: {
  roster: TeamRoster;
  highlightedPlayer: string | null;
  onPlayerHover: (playerName: string | null) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError("Google Maps API key not configured");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=beta`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapError("Failed to load Google Maps");
    document.head.appendChild(script);
  }, []);

  // Initialize map and markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || roster.players.length === 0) return;

    const playersWithCoords = roster.players.filter((p) => p.coordinates);
    if (playersWithCoords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    playersWithCoords.forEach((player) => {
      if (player.coordinates) {
        bounds.extend(new google.maps.LatLng(player.coordinates.lat, player.coordinates.lng));
      }
    });

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        mapId: "roster-map",
        center: bounds.getCenter(),
        zoom: 4,
        styles: DARK_MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current = [];

    // Create markers
    playersWithCoords.forEach((player) => {
      if (!player.coordinates) return;

      const markerContent = document.createElement("div");
      markerContent.innerHTML = `
        <div style="
          width: 14px;
          height: 14px;
          background-color: ${roster.primaryColor};
          border: 2px solid ${roster.secondaryColor};
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
        "></div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: player.coordinates.lat, lng: player.coordinates.lng },
        content: markerContent,
        title: player.name,
      });

      markerContent.addEventListener("mouseenter", () => onPlayerHover(player.name));
      markerContent.addEventListener("mouseleave", () => onPlayerHover(null));
      markerContent.addEventListener("click", () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; color: #1a1a2e;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${player.name}</div>
              <div style="font-size: 12px; color: #666;">
                #${player.number || "-"} | ${player.position}<br/>
                ${player.height} | ${player.hometown}<br/>
                ${player.stats?.pointsPerGame?.toFixed(1) || 0} PPG
              </div>
            </div>
          `,
        });
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [mapLoaded, roster, onPlayerHover]);

  // Update marker styles on highlight
  useEffect(() => {
    if (!mapLoaded) return;

    markersRef.current.forEach((marker) => {
      const isHighlighted = highlightedPlayer === marker.title;
      const content = marker.content as HTMLElement;
      if (content) {
        const dot = content.querySelector("div") as HTMLElement;
        if (dot) {
          dot.style.width = isHighlighted ? "20px" : "14px";
          dot.style.height = isHighlighted ? "20px" : "14px";
          dot.style.borderColor = isHighlighted ? "#fff" : "";
        }
      }
    });
  }, [highlightedPlayer, mapLoaded]);

  if (mapError) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <MapPin style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--foreground-muted)" }}>{mapError}</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <MapPin style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
          Player Hometowns
        </h3>
        <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--foreground-muted)" }}>
          {roster.players.filter((p) => p.coordinates).length} locations mapped
        </span>
      </div>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "500px",
          backgroundColor: "#0d1117",
        }}
      >
        {!mapLoaded && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page Component
export default function VisualRostersPage() {
  const [league, setLeague] = useState<League | null>(null);
  const [teamInput, setTeamInput] = useState("");
  const [roster, setRoster] = useState<TeamRoster | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);

  const searchTeam = useCallback(async () => {
    if (!league || !teamInput.trim()) return;

    setLoading(true);
    setError(null);
    setRoster(null);

    try {
      const response = await fetch(
        `/api/roster?league=${encodeURIComponent(league)}&team=${encodeURIComponent(teamInput.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch roster");
      }

      setRoster(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [league, teamInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchTeam();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "32px 24px 100px 24px",
          }}
        >
          <RemindersBanner />

          {/* Back Link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--foreground-muted)",
              fontSize: "14px",
              textDecoration: "none",
              marginBottom: "24px",
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Dashboard
          </Link>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users style={{ width: "24px", height: "24px", color: "var(--background)" }} />
              </div>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>
                  Visual Rosters
                </h1>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Basketball team rosters with stats and hometown mapping
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginTop: "24px" }}
          >
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "16px", alignItems: "end" }}>
                {/* League Selection */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--foreground-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Select League
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={league || ""}
                      onChange={(e) => setLeague(e.target.value as League)}
                      style={{
                        width: "100%",
                        padding: "12px 36px 12px 14px",
                        fontSize: "14px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "10px",
                        color: "var(--foreground)",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="" style={{ backgroundColor: "#1a1a2e" }}>
                        Choose a league...
                      </option>
                      {LEAGUES.map((l) => (
                        <option key={l.id} value={l.id} style={{ backgroundColor: "#1a1a2e" }}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "16px",
                        height: "16px",
                        color: "var(--foreground-muted)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Team Input */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--foreground-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Team Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "18px",
                        height: "18px",
                        color: "var(--foreground-muted)",
                      }}
                    />
                    <input
                      type="text"
                      placeholder={
                        league === "nba"
                          ? "e.g., Lakers, Celtics, Warriors..."
                          : league === "college"
                          ? "e.g., Duke, Kentucky, Gonzaga..."
                          : league === "international"
                          ? "e.g., Real Madrid, Olympiacos..."
                          : "Enter team name..."
                      }
                      value={teamInput}
                      onChange={(e) => setTeamInput(e.target.value)}
                      disabled={!league}
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 44px",
                        fontSize: "14px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "10px",
                        color: "var(--foreground)",
                        opacity: !league ? 0.5 : 1,
                      }}
                    />
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={!league || !teamInput.trim() || loading}
                  style={{
                    padding: "12px 28px",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    borderRadius: "10px",
                    cursor: !league || !teamInput.trim() || loading ? "not-allowed" : "pointer",
                    opacity: !league || !teamInput.trim() || loading ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search style={{ width: "18px", height: "18px" }} />
                      Search
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    color: "#ef4444",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}
            </form>
          </motion.div>

          {/* Results */}
          {roster && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <RosterTable
                roster={roster}
                highlightedPlayer={highlightedPlayer}
                onPlayerHover={setHighlightedPlayer}
              />
              <PlayerMap
                roster={roster}
                highlightedPlayer={highlightedPlayer}
                onPlayerHover={setHighlightedPlayer}
              />
            </motion.div>
          )}

          {/* Empty State */}
          {!roster && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-2xl"
              style={{
                marginTop: "24px",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <Users
                style={{
                  width: "48px",
                  height: "48px",
                  color: "var(--foreground-muted)",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ color: "var(--foreground-muted)", marginBottom: "8px" }}>
                Select a league and enter a team name to view their roster
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>
                Examples: &quot;Lakers&quot; (NBA), &quot;Duke&quot; (College), &quot;Real Madrid&quot; (International)
              </p>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl"
              style={{
                marginTop: "24px",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <Loader2
                style={{
                  width: "48px",
                  height: "48px",
                  color: "var(--accent)",
                  margin: "0 auto 16px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ color: "var(--foreground)" }}>
                Fetching roster for {teamInput}...
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginTop: "8px" }}>
                Gathering player data, stats, and hometown locations
              </p>
            </motion.div>
          )}
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
