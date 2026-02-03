"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { IntelToolsBar } from "@/components/home/IntelToolsBar";
import { GlanceBox } from "@/components/home/GlanceBox";
import { QuickAccessDock } from "@/components/home/QuickAccessDock";
import { RemindersBanner } from "@/components/RemindersBanner";
import { useEffect, useState } from "react";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: isMobile ? "88px" : "24px",
          padding: isMobile ? "64px 12px 88px 12px" : "64px 24px 24px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Reminders */}
          <RemindersBanner />

          {/* Date/Time (mobile only) */}
          {isMobile && <MobileDateTimeBanner />}

          {/* Search */}
          <div style={{ marginBottom: "32px" }}>
            <MultiSourceSearch />
          </div>

          {/* Intel Tools Bar */}
          <IntelToolsBar />

          {/* Glance Box */}
          <GlanceBox />

          {/* Quick Access Dock */}
          <QuickAccessDock />
        </div>
      </div>
    </>
  );
}

function MobileDateTimeBanner() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  const dateStr = dateTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const timeStr = dateTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "16px 0",
        marginBottom: "16px",
      }}
    >
      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
        {dateStr}
      </span>
      <span style={{ fontSize: "15px", fontWeight: 400, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
        {timeStr}
      </span>
    </div>
  );
}
