"use client";

import { Mail, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

interface GlanceData {
  emails: {
    count: number;
    loading: boolean;
  };
  calendar: {
    next: string | null;
    loading: boolean;
  };
  news: {
    headline: string | null;
    loading: boolean;
  };
  market: {
    change: string | null;
    loading: boolean;
  };
}

export function GlanceBox() {
  const [data, setData] = useState<GlanceData>({
    emails: { count: 0, loading: true },
    calendar: { next: null, loading: true },
    news: { headline: null, loading: true },
    market: { change: null, loading: true },
  });

  useEffect(() => {
    // Load glance data
    loadGlanceData();
  }, []);

  const loadGlanceData = async () => {
    // Email count
    fetch("/api/gmail?limit=1")
      .then((res) => res.json())
      .then((data) => {
        setData((prev) => ({
          ...prev,
          emails: { count: data.total || 0, loading: false },
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          emails: { count: 0, loading: false },
        }));
      });

    // Next calendar event
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        const upcoming = data.events?.find((e: any) => new Date(e.start) > new Date());
        setData((prev) => ({
          ...prev,
          calendar: {
            next: upcoming ? new Date(upcoming.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Clear",
            loading: false,
          },
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          calendar: { next: null, loading: false },
        }));
      });

    // Trending topic
    fetch("/api/trending?limit=1")
      .then((res) => res.json())
      .then((data) => {
        const top = data.trends?.[0];
        setData((prev) => ({
          ...prev,
          news: {
            headline: top?.name || "No trends",
            loading: false,
          },
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          news: { headline: null, loading: false },
        }));
      });

    // Market snapshot (placeholder - needs actual API)
    setTimeout(() => {
      setData((prev) => ({
        ...prev,
        market: { change: "+2.1%", loading: false },
      }));
    }, 500);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      <GlanceCard
        icon={Mail}
        label="Inbox"
        value={data.emails.loading ? "..." : data.emails.count.toString()}
        color="var(--accent)"
      />
      <GlanceCard
        icon={Calendar}
        label="Next"
        value={data.calendar.loading ? "..." : data.calendar.next || "Clear"}
        color="var(--success)"
      />
      <GlanceCard
        icon={TrendingUp}
        label="Trending"
        value={data.news.loading ? "..." : data.news.headline || "—"}
        color="var(--warning)"
        compact
      />
      <GlanceCard
        icon={DollarSign}
        label="Market"
        value={data.market.loading ? "..." : data.market.change || "—"}
        color={data.market.change?.startsWith("+") ? "var(--success)" : "var(--error)"}
      />
    </div>
  );
}

function GlanceCard({
  icon: Icon,
  label,
  value,
  color,
  compact = false,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "var(--glass-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--glass-border)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <Icon style={{ width: "16px", height: "16px", color }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: compact ? "14px" : "20px",
          fontWeight: 700,
          color: "var(--foreground)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: compact ? "nowrap" : "normal",
        }}
      >
        {value}
      </div>
    </div>
  );
}
