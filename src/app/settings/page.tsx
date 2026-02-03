"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useSettings, THEME_COLORS, TIMEZONES, TOOL_IDS } from "@/contexts/SettingsContext";
import { Settings as SettingsIcon, Palette, Clock, Search, History } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <SettingsIcon style={{ width: "32px", height: "32px", color: "var(--accent)" }} />
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                Settings
              </h1>
            </div>
            <p style={{ fontSize: "16px", color: "var(--foreground-muted)" }}>
              Configure your dashboard preferences
            </p>
          </div>

          {/* Theme Settings */}
          <Section
            icon={<Palette style={{ width: "20px", height: "20px" }} />}
            title="Theme"
            description="Customize the look and feel of your dashboard"
          >
            {/* Theme Mode */}
            <SettingRow label="Mode">
              <div style={{ display: "flex", gap: "8px" }}>
                {["dark", "light"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ themeMode: mode as "dark" | "light" })}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: 600,
                      background: settings.themeMode === mode
                        ? "linear-gradient(135deg, var(--accent) 0%, var(--accent) 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: settings.themeMode === mode
                        ? "2px solid var(--accent)"
                        : "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      color: settings.themeMode === mode ? "#ffffff" : "var(--foreground-muted)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </SettingRow>

            {/* Theme Color */}
            <SettingRow label="Accent Color">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(6, 1fr)" : "repeat(8, 1fr)",
                  gap: "8px",
                }}
              >
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSettings({ themeColor: color.value })}
                    title={color.name}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "8px",
                      backgroundColor: color.value,
                      border: settings.themeColor === color.value
                        ? "3px solid #ffffff"
                        : "2px solid rgba(255, 255, 255, 0.2)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: settings.themeColor === color.value
                        ? `0 0 0 2px ${color.value}`
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (settings.themeColor !== color.value) {
                        e.currentTarget.style.transform = "scale(1.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  />
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* Time & Date Settings */}
          <Section
            icon={<Clock style={{ width: "20px", height: "20px" }} />}
            title="Time & Date"
            description="Configure timezone and time format preferences"
          >
            {/* Timezone */}
            <SettingRow label="Timezone">
              <select
                value={settings.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "14px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} style={{ backgroundColor: "var(--dropdown-bg)" }}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </SettingRow>

            {/* Time Format */}
            <SettingRow label="Time Format">
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: "12h", label: "12-hour (2:30 PM)" },
                  { value: "24h", label: "24-hour (14:30)" },
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => updateSettings({ timeFormat: format.value as "12h" | "24h" })}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      background: settings.timeFormat === format.value
                        ? "linear-gradient(135deg, var(--accent) 0%, var(--accent) 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: settings.timeFormat === format.value
                        ? "2px solid var(--accent)"
                        : "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      color: settings.timeFormat === format.value ? "#ffffff" : "var(--foreground-muted)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* Recent Searches Settings */}
          <Section
            icon={<History style={{ width: "20px", height: "20px" }} />}
            title="Recent Searches"
            description="Control which tools show recent search history"
          >
            {/* Max Recent Items */}
            <SettingRow label="Items to Show">
              <input
                type="number"
                min="3"
                max="10"
                value={settings.recentSearches.maxRecentItems}
                onChange={(e) =>
                  updateSettings({
                    recentSearches: {
                      ...settings.recentSearches,
                      maxRecentItems: parseInt(e.target.value) || 5,
                    },
                  })
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "14px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
              />
            </SettingRow>

            {/* Enabled Tools */}
            <SettingRow label="Enabled for Tools">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                {TOOL_IDS.map((toolId) => {
                  const isEnabled = settings.recentSearches.enabledTools.includes(toolId);
                  return (
                    <button
                      key={toolId}
                      onClick={() => {
                        const newEnabled = isEnabled
                          ? settings.recentSearches.enabledTools.filter((id) => id !== toolId)
                          : [...settings.recentSearches.enabledTools, toolId];
                        updateSettings({
                          recentSearches: {
                            ...settings.recentSearches,
                            enabledTools: newEnabled,
                          },
                        });
                      }}
                      style={{
                        padding: "10px 14px",
                        fontSize: "13px",
                        fontWeight: 500,
                        background: isEnabled
                          ? "rgba(var(--accent-rgb), 0.15)"
                          : "rgba(255, 255, 255, 0.03)",
                        border: isEnabled
                          ? "2px solid var(--accent)"
                          : "1px solid var(--glass-border)",
                        borderRadius: "8px",
                        color: isEnabled ? "var(--accent)" : "var(--foreground-muted)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textTransform: "capitalize",
                      }}
                    >
                      {toolId.replace(/-/g, " ")}
                    </button>
                  );
                })}
              </div>
            </SettingRow>
          </Section>
        </div>
      </div>
    </>
  );
}

// Section Component
function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="glass"
      style={{
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "24px",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ color: "var(--accent)" }}>{icon}</div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", margin: 0 }}>
          {description}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {children}
      </div>
    </div>
  );
}

// Setting Row Component
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--foreground)",
          marginBottom: "10px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
