"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Users,
  MapPin,
  Loader2,
  ChevronDown,
  Trophy,
  History,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  User,
  Target,
  Clock,
  Plus,
  X,
  Database,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { League, LEAGUES, TeamRoster, Player, TeamProfile } from "@/types/roster";

// Recent roster type
interface RecentRoster {
  league: League;
  teamName: string;
  leagueName: string;
  primaryColor: string;
  secondaryColor: string;
  season: string;
  playerCount: number;
  logoUrl: string | null;
  record: string | null;
  searchedAt: string;
  cacheKey: string;
}

// Generate external profile URL for a player
function getPlayerProfileUrl(playerName: string, league: League): string {
  // Format name for URL (lowercase, hyphenated)
  const formattedName = playerName.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, "-");
  const searchQuery = encodeURIComponent(playerName);

  switch (league) {
    case "nba":
      // Basketball Reference search
      return `https://www.basketball-reference.com/search/search.fcgi?search=${searchQuery}`;
    case "college":
      // Sports Reference college basketball search
      return `https://www.sports-reference.com/cbb/search/search.fcgi?search=${searchQuery}`;
    case "international":
      // Use Wikipedia for international players
      return `https://en.wikipedia.org/wiki/Special:Search?search=${searchQuery}+basketball`;
    default:
      return `https://www.google.com/search?q=${searchQuery}+basketball`;
  }
}

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

// Helper to safely format numbers
function safeToFixed(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "0.0";
  return value.toFixed(decimals);
}

// Team Profile Component
function TeamProfileCard({ roster }: { roster: TeamRoster }) {
  const profile = roster.profile;
  if (!profile) return null;

  const [logoError, setLogoError] = useState(false);

  // Safe access to stats with defaults
  const stats = profile.stats || {
    wins: 0,
    losses: 0,
    winPercentage: 0,
    pointsPerGame: 0,
    pointsAllowedPerGame: 0,
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Team Header with Logo */}
      <div
        style={{
          padding: "24px",
          background: `linear-gradient(135deg, ${roster.primaryColor}22 0%, transparent 50%)`,
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* Logo */}
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "16px",
              backgroundColor: roster.primaryColor,
              border: `3px solid ${roster.secondaryColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {profile.logoUrl && !logoError ? (
              <Image
                src={profile.logoUrl}
                alt={`${roster.teamName} logo`}
                width={80}
                height={80}
                style={{ objectFit: "contain" }}
                onError={() => setLogoError(true)}
                unoptimized
              />
            ) : (
              <Trophy style={{ width: "48px", height: "48px", color: roster.secondaryColor }} />
            )}
          </div>

          {/* Team Info */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px" }}>
              {roster.teamName}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
              {roster.leagueName} • {roster.season} Season
            </p>

            {/* Quick Stats Row */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)" }}>
                  {stats.wins ?? 0}-{stats.losses ?? 0}
                </span>
                <span style={{ fontSize: "13px", color: "var(--foreground-muted)", marginLeft: "8px" }}>
                  ({safeToFixed((stats.winPercentage ?? 0) * 100)}%)
                </span>
              </div>
              {stats.conferenceRank && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Target style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                  <span style={{ fontSize: "14px", color: "var(--foreground)" }}>
                    #{stats.conferenceRank} in Conference
                  </span>
                </div>
              )}
              {profile.championships && profile.championships > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Trophy style={{ width: "16px", height: "16px", color: "#fbbf24" }} />
                  <span style={{ fontSize: "14px", color: "var(--foreground)" }}>
                    {profile.championships} Championship{profile.championships > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        {/* Team Info */}
        <div>
          <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Team Info
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
              <span style={{ fontSize: "13px", color: "var(--foreground)" }}>{profile.arena}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
              <span style={{ fontSize: "13px", color: "var(--foreground)" }}>
                {profile.city}{profile.state ? `, ${profile.state}` : ""}, {profile.country}
              </span>
            </div>
            {profile.founded && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                <span style={{ fontSize: "13px", color: "var(--foreground)" }}>Founded {profile.founded}</span>
              </div>
            )}
          </div>
        </div>

        {/* Team Stats */}
        <div>
          <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Team Statistics
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent)" }}>
                {safeToFixed(stats.pointsPerGame)}
              </div>
              <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>PPG</div>
            </div>
            <div style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>
                {safeToFixed(stats.pointsAllowedPerGame)}
              </div>
              <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Opp PPG</div>
            </div>
            {stats.reboundsPerGame != null && (
              <div style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>
                  {safeToFixed(stats.reboundsPerGame)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>RPG</div>
              </div>
            )}
            {stats.assistsPerGame != null && (
              <div style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>
                  {safeToFixed(stats.assistsPerGame)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>APG</div>
              </div>
            )}
          </div>
        </div>

        {/* Coaches */}
        {profile.coaches && profile.coaches.length > 0 && (
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Coaching Staff
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile.coaches.map((coach, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <User style={{ width: "14px", height: "14px", color: idx === 0 ? "var(--accent)" : "var(--foreground-muted)" }} />
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: idx === 0 ? 600 : 400, color: "var(--foreground)" }}>
                      {coach.name}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--foreground-muted)", marginLeft: "6px" }}>
                      {coach.role}
                      {coach.yearsWithTeam ? ` (${coach.yearsWithTeam} yr${coach.yearsWithTeam > 1 ? "s" : ""})` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Results */}
        {profile.recentResults && profile.recentResults.length > 0 && (
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Recent Games
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {profile.recentResults.slice(0, 5).map((result, idx) => {
                const isWin = result.startsWith("W");
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    {isWin ? (
                      <TrendingUp style={{ width: "14px", height: "14px", color: "#22c55e" }} />
                    ) : (
                      <TrendingDown style={{ width: "14px", height: "14px", color: "#ef4444" }} />
                    )}
                    <span style={{ color: isWin ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                      {result.charAt(0)}
                    </span>
                    <span style={{ color: "var(--foreground)" }}>
                      {result.substring(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Roster Table Component
function RosterTable({
  roster,
  highlightedPlayer,
  onPlayerHover,
  league,
}: {
  roster: TeamRoster;
  highlightedPlayer: string | null;
  onPlayerHover: (playerName: string | null) => void;
  league: League;
}) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Table Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Users style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
          Roster
        </h3>
        <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--foreground-muted)" }}>
          {roster.players.length} players
        </span>
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
                    <a
                      href={getPlayerProfileUrl(player.name, league)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: "var(--foreground)",
                        textDecoration: "none",
                        borderBottom: "1px dashed var(--foreground-muted)",
                        transition: "color 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--accent)";
                        e.currentTarget.style.borderColor = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--foreground)";
                        e.currentTarget.style.borderColor = "var(--foreground-muted)";
                      }}
                    >
                      {player.name}
                    </a>
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
  const [fromCache, setFromCache] = useState(false);

  // Second team for side-by-side comparison
  const [showSecondTeam, setShowSecondTeam] = useState(false);
  const [teamInput2, setTeamInput2] = useState("");
  const [roster2, setRoster2] = useState<TeamRoster | null>(null);
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState<string | null>(null);
  const [fromCache2, setFromCache2] = useState(false);

  // Recent rosters
  const [recentRosters, setRecentRosters] = useState<RecentRoster[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Fetch recent rosters on mount
  useEffect(() => {
    async function fetchRecentRosters() {
      try {
        const response = await fetch("/api/roster/recent?limit=8");
        if (response.ok) {
          const data = await response.json();
          setRecentRosters(data.rosters || []);
        }
      } catch (err) {
        console.error("Error fetching recent rosters:", err);
      } finally {
        setLoadingRecent(false);
      }
    }
    fetchRecentRosters();
  }, []);

  const searchTeam = useCallback(async (teamName?: string, targetLeague?: League) => {
    const searchLeague = targetLeague || league;
    const searchTeamName = teamName || teamInput.trim();
    if (!searchLeague || !searchTeamName) return;

    setLoading(true);
    setError(null);
    setRoster(null);
    setFromCache(false);

    try {
      const response = await fetch(
        `/api/roster?league=${encodeURIComponent(searchLeague)}&team=${encodeURIComponent(searchTeamName)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch roster");
      }

      setRoster(data.data);
      setFromCache(data.fromCache || false);
      setLeague(searchLeague);
      setTeamInput(searchTeamName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [league, teamInput]);

  const searchTeam2 = useCallback(async () => {
    if (!league || !teamInput2.trim()) return;

    setLoading2(true);
    setError2(null);
    setRoster2(null);
    setFromCache2(false);

    try {
      const response = await fetch(
        `/api/roster?league=${encodeURIComponent(league)}&team=${encodeURIComponent(teamInput2.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch roster");
      }

      setRoster2(data.data);
      setFromCache2(data.fromCache || false);
    } catch (err) {
      setError2(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading2(false);
    }
  }, [league, teamInput2]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchTeam();
  };

  const handleSubmit2 = (e: React.FormEvent) => {
    e.preventDefault();
    searchTeam2();
  };

  const handleRecentClick = (recent: RecentRoster) => {
    searchTeam(recent.teamName, recent.league);
  };

  const clearSecondTeam = () => {
    setShowSecondTeam(false);
    setTeamInput2("");
    setRoster2(null);
    setError2(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)", width: "100%" }}>
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
                  Basketball team profiles, rosters, and hometown mapping
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent Rosters */}
          {recentRosters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              style={{ marginTop: "16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <Clock style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Recently Searched
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {recentRosters.map((recent) => (
                  <button
                    key={recent.cacheKey}
                    onClick={() => handleRecentClick(recent)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: `1px solid ${recent.primaryColor}44`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${recent.primaryColor}22`;
                      e.currentTarget.style.borderColor = recent.primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = `${recent.primaryColor}44`;
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: recent.primaryColor,
                      }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
                      {recent.teamName}
                    </span>
                    {recent.record && (
                      <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                        ({recent.record})
                      </span>
                    )}
                    <Database style={{ width: "10px", height: "10px", color: "var(--accent)", opacity: 0.6 }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

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
                      onChange={(e) => {
                        setLeague(e.target.value as League);
                        // Clear second team if league changes
                        if (showSecondTeam) {
                          setTeamInput2("");
                          setRoster2(null);
                        }
                      }}
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
                    {showSecondTeam ? "Team 1" : "Team Name"}
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

              {/* Second Team Input (for side-by-side comparison) */}
              {showSecondTeam && (
                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "16px", alignItems: "end" }}>
                  <div>
                    {/* Spacer to align with first row */}
                  </div>
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
                      Team 2 (Same League)
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
                        placeholder="Enter opponent team name..."
                        value={teamInput2}
                        onChange={(e) => setTeamInput2(e.target.value)}
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
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={handleSubmit2}
                      disabled={!league || !teamInput2.trim() || loading2}
                      style={{
                        padding: "12px 20px",
                        fontSize: "14px",
                        fontWeight: 600,
                        backgroundColor: "var(--accent)",
                        color: "var(--background)",
                        border: "none",
                        borderRadius: "10px",
                        cursor: !league || !teamInput2.trim() || loading2 ? "not-allowed" : "pointer",
                        opacity: !league || !teamInput2.trim() || loading2 ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {loading2 ? (
                        <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Search style={{ width: "18px", height: "18px" }} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={clearSecondTeam}
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X style={{ width: "18px", height: "18px" }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Compare Teams Button */}
              {!showSecondTeam && roster && (
                <button
                  type="button"
                  onClick={() => setShowSecondTeam(true)}
                  style={{
                    marginTop: "16px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "var(--foreground)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                  }}
                >
                  <Plus style={{ width: "16px", height: "16px" }} />
                  Compare with Another Team
                </button>
              )}

              {/* Cache indicator */}
              {(fromCache || fromCache2) && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "var(--accent)",
                    opacity: 0.8,
                  }}
                >
                  <Database style={{ width: "12px", height: "12px" }} />
                  <span>Loaded from cache for faster results</span>
                </div>
              )}

              {/* Error Messages */}
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
                  Team 1: {error}
                </div>
              )}
              {error2 && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "12px 16px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    color: "#ef4444",
                    fontSize: "13px",
                  }}
                >
                  Team 2: {error2}
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
              {/* Side-by-side or single view */}
              {roster2 ? (
                <>
                  {/* Side-by-side Team Profiles */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <TeamProfileCard roster={roster} />
                    <TeamProfileCard roster={roster2} />
                  </div>

                  {/* Side-by-side Roster Tables */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <RosterTable
                      roster={roster}
                      highlightedPlayer={highlightedPlayer}
                      onPlayerHover={setHighlightedPlayer}
                      league={league!}
                    />
                    <RosterTable
                      roster={roster2}
                      highlightedPlayer={highlightedPlayer}
                      onPlayerHover={setHighlightedPlayer}
                      league={league!}
                    />
                  </div>

                  {/* Combined Player Map - shows both teams */}
                  <PlayerMap
                    roster={{
                      ...roster,
                      players: [
                        ...roster.players,
                        ...roster2.players.map(p => ({
                          ...p,
                          // Mark second team players with different color
                        }))
                      ]
                    }}
                    highlightedPlayer={highlightedPlayer}
                    onPlayerHover={setHighlightedPlayer}
                  />
                </>
              ) : (
                <>
                  {/* Single Team View */}
                  <TeamProfileCard roster={roster} />

                  <RosterTable
                    roster={roster}
                    highlightedPlayer={highlightedPlayer}
                    onPlayerHover={setHighlightedPlayer}
                    league={league!}
                  />

                  <PlayerMap
                    roster={roster}
                    highlightedPlayer={highlightedPlayer}
                    onPlayerHover={setHighlightedPlayer}
                  />
                </>
              )}
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
                Select a league and enter a team name to view their profile and roster
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
                Fetching team profile and roster for {teamInput}...
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginTop: "8px" }}>
                Gathering team info, player data, stats, and hometown locations
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
