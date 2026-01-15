"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Users, MapPin, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { League, LEAGUES, TeamRoster, Player } from "@/types/roster";

// Roster Table Component
function RosterTable({
  roster,
  highlightedPlayer,
  onPlayerHover,
  teamIndex,
}: {
  roster: TeamRoster;
  highlightedPlayer: string | null;
  onPlayerHover: (playerName: string | null) => void;
  teamIndex: number;
}) {
  const seasonYears = roster.players[0]?.seasons?.map((s) => s.year) || [];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Team Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: roster.primaryColor,
            border: `2px solid ${roster.secondaryColor}`,
          }}
        />
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
          {roster.teamName}
        </h3>
        <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
          {roster.season} Season
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "13px",
            color: "var(--foreground-muted)",
          }}
        >
          {roster.players.length} players
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <th style={thStyle}>#</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Name</th>
              <th style={thStyle}>Pos</th>
              <th style={thStyle}>Ht</th>
              <th style={thStyle}>Wt</th>
              <th style={thStyle}>Age</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Hometown</th>
              <th style={{ ...thStyle, textAlign: "left" }}>High School</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Prev School</th>
              {seasonYears.map((year) => (
                <th key={year} style={thStyle}>
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.players.map((player, index) => (
              <tr
                key={`${player.name}-${index}`}
                onMouseEnter={() => onPlayerHover(player.name)}
                onMouseLeave={() => onPlayerHover(null)}
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
                <td style={tdStyle}>{player.number}</td>
                <td style={{ ...tdStyle, fontWeight: 500, textAlign: "left" }}>
                  {player.playerUrl ? (
                    <a
                      href={player.playerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--foreground)",
                        textDecoration: "none",
                        borderBottom: "1px dashed var(--foreground-muted)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = roster.primaryColor)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                    >
                      {player.name}
                    </a>
                  ) : (
                    player.name
                  )}
                </td>
                <td style={tdStyle}>{player.position}</td>
                <td style={tdStyle}>{player.height}</td>
                <td style={tdStyle}>{player.weight}</td>
                <td style={tdStyle}>{player.age}</td>
                <td style={{ ...tdStyle, textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                    <span>{player.hometown || "N/A"}</span>
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: "left", maxWidth: "150px" }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                    {player.highSchool || "N/A"}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: "left" }}>
                  {player.previousSchools?.join(", ") || "N/A"}
                </td>
                {player.seasons?.map((season, idx) => (
                  <td key={idx} style={{ ...tdStyle, fontSize: "11px", maxWidth: "80px" }}>
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                    >
                      {season.team || "-"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "center",
  fontWeight: 600,
  color: "var(--foreground-muted)",
  borderBottom: "1px solid var(--glass-border)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "center",
  color: "var(--foreground)",
  borderBottom: "1px solid var(--glass-border)",
};

// Dark map styles for a sleek look
const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6e7681" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#21262d" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#6e7681" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#21262d" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#21262d" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry", stylers: [{ color: "#161b22" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#161b22" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6e7681" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#0d1117" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3d4f5f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#161b22" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#21262d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6e7681" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#21262d" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#30363d" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#161b22" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#6e7681" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#010409" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d4f5f" }] },
];

// Map Component
function PlayerMap({
  rosters,
  highlightedPlayer,
  onPlayerHover,
}: {
  rosters: TeamRoster[];
  highlightedPlayer: string | null;
  onPlayerHover: (playerName: string | null) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const hasInitializedRef = useRef(false);
  const lastRosterSignatureRef = useRef<string>("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError("Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=beta`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapError("Failed to load Google Maps");
    document.head.appendChild(script);

    return () => {
      // Cleanup is handled by browser
    };
  }, []);

  // Initialize map and markers (only when rosters change, NOT when highlightedPlayer changes)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || rosters.length === 0) return;

    // Collect all players with coordinates
    const allPlayers: { player: Player; roster: TeamRoster }[] = [];
    rosters.forEach((roster) => {
      roster.players.forEach((player) => {
        if (player.coordinates) {
          allPlayers.push({ player, roster });
        }
      });
    });

    if (allPlayers.length === 0) return;

    // Calculate bounds
    const bounds = new google.maps.LatLngBounds();
    allPlayers.forEach(({ player }) => {
      if (player.coordinates) {
        bounds.extend(new google.maps.LatLng(player.coordinates.lat, player.coordinates.lng));
      }
    });

    // Create map if not exists
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

    // Create markers for each player
    allPlayers.forEach(({ player, roster }) => {
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
          transition: all 0.2s;
          cursor: pointer;
        "></div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: player.coordinates.lat, lng: player.coordinates.lng },
        content: markerContent,
        title: player.name,
      });

      // Add hover events
      markerContent.addEventListener("mouseenter", () => onPlayerHover(player.name));
      markerContent.addEventListener("mouseleave", () => onPlayerHover(null));
      markerContent.addEventListener("click", () => {
        // Show info window on click
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; color: #1a1a2e;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${player.name}</div>
              <div style="font-size: 12px; color: #666;">
                #${player.number} | ${player.position}<br/>
                ${player.height} | ${player.weight} lbs<br/>
                ${player.hometown}
              </div>
            </div>
          `,
        });
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Create a signature of current rosters to detect when teams change
    const rosterSignature = rosters.map(r => r.teamName).join("|");

    // Reset initialization if rosters changed (new team loaded)
    if (lastRosterSignatureRef.current !== rosterSignature) {
      hasInitializedRef.current = false;
      lastRosterSignatureRef.current = rosterSignature;
    }

    // Only fit bounds on initial load or when new team is loaded (not on hover)
    if (!hasInitializedRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      hasInitializedRef.current = true;
    }
  }, [mapLoaded, rosters, onPlayerHover]); // Removed highlightedPlayer from dependencies

  // Update marker styles when highlighted player changes (without re-fitting bounds)
  useEffect(() => {
    if (!mapLoaded) return;

    markersRef.current.forEach((marker) => {
      const title = marker.title;
      const isHighlighted = highlightedPlayer === title;
      const content = marker.content as HTMLElement;
      if (content) {
        const dot = content.querySelector("div") as HTMLElement;
        if (dot) {
          dot.style.width = isHighlighted ? "20px" : "14px";
          dot.style.height = isHighlighted ? "20px" : "14px";
          dot.style.borderColor = isHighlighted ? "#fff" : "";
          dot.style.zIndex = isHighlighted ? "1000" : "1";
        }
      }
    });
  }, [highlightedPlayer, mapLoaded]);

  if (mapError) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <MapPin style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--foreground-muted)", marginBottom: "8px" }}>{mapError}</p>
        <p style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>
          To enable the map, add your Google Maps API key to your environment variables.
        </p>
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
        {rosters.length > 1 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
            {rosters.map((roster, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: roster.primaryColor,
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                  {roster.teamName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "650px",
          backgroundColor: "#0d1117",
        }}
      >
        {!mapLoaded && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader2
              style={{
                width: "32px",
                height: "32px",
                color: "var(--accent)",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Team Search Component
function TeamSearch({
  index,
  league,
  onSearch,
  isLoading,
}: {
  index: number;
  league: League | null;
  onSearch: (team: string) => void;
  isLoading: boolean;
}) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && league) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderRadius: "12px",
          padding: "8px 12px",
        }}
      >
        <Search
          style={{
            width: "18px",
            height: "18px",
            flexShrink: 0,
            color: "var(--foreground-muted)",
          }}
        />
        <input
          type="text"
          placeholder={`Search Team ${index + 1}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!league || isLoading}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "14px",
            color: "var(--foreground)",
            padding: "8px 0",
            opacity: !league ? 0.5 : 1,
          }}
        />
        <button
          type="submit"
          disabled={!league || !query.trim() || isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            borderRadius: "8px",
            backgroundColor: "var(--accent)",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--background)",
            border: "none",
            cursor: !league || !query.trim() || isLoading ? "not-allowed" : "pointer",
            opacity: !league || !query.trim() || isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}

// Main Page Component
export default function VisualRostersPage() {
  const [league, setLeague] = useState<League | null>(null);
  const [teamCount, setTeamCount] = useState<1 | 2>(1);
  const [rosters, setRosters] = useState<(TeamRoster | null)[]>([null, null]);
  const [loading, setLoading] = useState<boolean[]>([false, false]);
  const [errors, setErrors] = useState<(string | null)[]>([null, null]);
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);

  const searchTeam = useCallback(
    async (teamIndex: number, teamName: string) => {
      if (!league) return;

      setLoading((prev) => {
        const newLoading = [...prev];
        newLoading[teamIndex] = true;
        return newLoading;
      });
      setErrors((prev) => {
        const newErrors = [...prev];
        newErrors[teamIndex] = null;
        return newErrors;
      });

      try {
        const response = await fetch(
          `/api/roster?league=${encodeURIComponent(league)}&team=${encodeURIComponent(teamName)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || "Failed to fetch roster");
        }

        setRosters((prev) => {
          const newRosters = [...prev];
          newRosters[teamIndex] = data.data;
          return newRosters;
        });
      } catch (err) {
        setErrors((prev) => {
          const newErrors = [...prev];
          newErrors[teamIndex] = err instanceof Error ? err.message : "An error occurred";
          return newErrors;
        });
      } finally {
        setLoading((prev) => {
          const newLoading = [...prev];
          newLoading[teamIndex] = false;
          return newLoading;
        });
      }
    },
    [league]
  );

  // Clear second roster when switching to single team mode
  useEffect(() => {
    if (teamCount === 1) {
      setRosters((prev) => [prev[0], null]);
      setErrors((prev) => [prev[0], null]);
    }
  }, [teamCount]);

  const activeRosters = rosters.filter((r): r is TeamRoster => r !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "32px 24px",
          }}
        >
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
                  View team rosters with player details and hometown mapping
                </p>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginTop: "24px" }}
          >
            <div className="glass rounded-2xl p-6">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
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
                        padding: "10px 36px 10px 12px",
                        fontSize: "14px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "8px",
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

                {/* Team Count Selection */}
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
                    Number of Teams
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTeamCount(count as 1 | 2)}
                        className={teamCount !== count ? "glass" : ""}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          fontSize: "14px",
                          fontWeight: 500,
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: teamCount === count ? "var(--accent)" : "transparent",
                          color: teamCount === count ? "var(--background)" : "var(--foreground)",
                          transition: "all 0.2s",
                        }}
                      >
                        {count} Team{count > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Search Bars */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: teamCount === 2 ? "1fr 1fr" : "1fr",
                  gap: "16px",
                }}
              >
                <TeamSearch
                  index={0}
                  league={league}
                  onSearch={(team) => searchTeam(0, team)}
                  isLoading={loading[0]}
                />
                {teamCount === 2 && (
                  <TeamSearch
                    index={1}
                    league={league}
                    onSearch={(team) => searchTeam(1, team)}
                    isLoading={loading[1]}
                  />
                )}
              </div>

              {/* Error Messages */}
              {errors.map(
                (error, idx) =>
                  error && (
                    <div
                      key={idx}
                      style={{
                        marginTop: "12px",
                        padding: "12px 16px",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "8px",
                        color: "#ef4444",
                        fontSize: "13px",
                      }}
                    >
                      Team {idx + 1} Error: {error}
                    </div>
                  )
              )}
            </div>
          </motion.div>

          {/* Roster Tables */}
          {activeRosters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {rosters.map(
                (roster, idx) =>
                  roster && (
                    <RosterTable
                      key={`roster-${idx}`}
                      roster={roster}
                      highlightedPlayer={highlightedPlayer}
                      onPlayerHover={setHighlightedPlayer}
                      teamIndex={idx}
                    />
                  )
              )}
            </motion.div>
          )}

          {/* Map */}
          {activeRosters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ marginTop: "24px", marginBottom: "150px" }}
            >
              <PlayerMap
                rosters={activeRosters}
                highlightedPlayer={highlightedPlayer}
                onPlayerHover={setHighlightedPlayer}
              />
            </motion.div>
          )}

          {/* Empty State */}
          {activeRosters.length === 0 && !loading[0] && !loading[1] && (
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
                Select a league and search for a team to view their roster
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>
                Example: Select &quot;NCAA Basketball&quot; and search &quot;Iowa&quot;
              </p>
            </motion.div>
          )}

          {/* Loading State */}
          {(loading[0] || loading[1]) && (
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
              <p style={{ color: "var(--foreground-muted)" }}>
                Fetching roster data...
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginTop: "8px" }}>
                This may take a moment while we gather player information
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
