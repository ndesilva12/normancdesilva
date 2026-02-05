"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useSettings } from "@/contexts/SettingsContext";
import { ToolSettings } from "@/components/ToolSettings";
import { Settings as SettingsIcon, Palette } from "lucide-react";
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
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "40px" }}>
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
            <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
              Manage your preferences and customize your dashboard
            </p>
          </div>

          {/* Theme Settings */}
          <Section icon={Palette} title="Appearance">
            <SettingRow label="Theme Mode">
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { value: "dark", label: "Dark" },
                  { value: "light", label: "Light" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updateSettings({ themeMode: mode.value as "dark" | "light" })}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      fontSize: "14px",
                      fontWeight: 600,
                      background: settings.themeMode === mode.value
                        ? "linear-gradient(135deg, var(--accent) 0%, var(--accent) 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: settings.themeMode === mode.value
                        ? "2px solid var(--accent)"
                        : "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      color: settings.themeMode === mode.value ? "#ffffff" : "var(--foreground-muted)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* Tool Settings */}
          <Section icon={null} title="Tools">
            <ToolSettings />
          </Section>
        </div>
      </div>
    </>
  );
}

// Section Component
function Section({
  icon: IconComponent,
  title,
  children,
}: {
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }> | null;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="glass"
      style={{
        padding: "32px",
        borderRadius: "12px",
        marginBottom: "24px",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          {IconComponent && (
            <div style={{ color: "var(--accent)" }}>
              <IconComponent size={24} />
            </div>
          )}
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
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
          marginBottom: "12px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
