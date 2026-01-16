"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sun,
  Moon,
  Palette,
  Clock,
  Globe,
  Link2,
  Check,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";
import { useSettings, THEME_COLORS, TIMEZONES, ThemeMode, TimeFormat } from "@/contexts/SettingsContext";

type SettingsTab = "appearance" | "time" | "integrations";

export function SettingsPopup() {
  const { settings, updateSettings, isSettingsOpen, closeSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [newEmail, setNewEmail] = useState("");

  if (!isSettingsOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "time", label: "Time & Date", icon: Clock },
    { id: "integrations", label: "Integrations", icon: Link2 },
  ];

  const handleAddEmail = () => {
    if (newEmail && !settings.connectedEmails.includes(newEmail)) {
      updateSettings({ connectedEmails: [...settings.connectedEmails, newEmail] });
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    updateSettings({ connectedEmails: settings.connectedEmails.filter(e => e !== email) });
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSettings}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              margin: "auto",
              width: "calc(100% - 32px)",
              maxWidth: "600px",
              height: "fit-content",
              maxHeight: "calc(100vh - 48px)",
              backgroundColor: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              overflow: "hidden",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)" }}>
                Settings
              </h2>
              <button
                onClick={closeSettings}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                padding: "12px 24px",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      backgroundColor: activeTab === tab.id ? "var(--accent)" : "transparent",
                      color: activeTab === tab.id ? "var(--background)" : "var(--foreground-muted)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon style={{ width: "16px", height: "16px" }} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Theme Mode */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                      Theme Mode
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {(["dark", "light"] as ThemeMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateSettings({ themeMode: mode })}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            padding: "16px",
                            borderRadius: "12px",
                            backgroundColor: settings.themeMode === mode ? "rgba(var(--accent-rgb), 0.15)" : "rgba(255, 255, 255, 0.05)",
                            border: settings.themeMode === mode ? "2px solid var(--accent)" : "2px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {mode === "dark" ? (
                            <Moon style={{ width: "20px", height: "20px", color: settings.themeMode === mode ? "var(--accent)" : "var(--foreground-muted)" }} />
                          ) : (
                            <Sun style={{ width: "20px", height: "20px", color: settings.themeMode === mode ? "var(--accent)" : "var(--foreground-muted)" }} />
                          )}
                          <span style={{ fontSize: "14px", fontWeight: 500, color: settings.themeMode === mode ? "var(--accent)" : "var(--foreground-muted)", textTransform: "capitalize" }}>
                            {mode}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Color */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                      Accent Color
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                      {THEME_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => updateSettings({ themeColor: color.value })}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 8px",
                            borderRadius: "10px",
                            backgroundColor: settings.themeColor === color.value ? `${color.value}20` : "rgba(255, 255, 255, 0.03)",
                            border: settings.themeColor === color.value ? `2px solid ${color.value}` : "2px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: color.value,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {settings.themeColor === color.value && (
                              <Check style={{ width: "16px", height: "16px", color: "#000" }} />
                            )}
                          </div>
                          <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Time & Date Tab */}
              {activeTab === "time" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Timezone */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                      <Globe style={{ width: "16px", height: "16px", display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSettings({ timezone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--glass-border)",
                        color: "var(--foreground)",
                        fontSize: "14px",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value} style={{ backgroundColor: "#1a1a1a" }}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                      <Clock style={{ width: "16px", height: "16px", display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
                      Time Format
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {(["12h", "24h"] as TimeFormat[]).map((format) => (
                        <button
                          key={format}
                          onClick={() => updateSettings({ timeFormat: format })}
                          style={{
                            flex: 1,
                            padding: "14px 20px",
                            borderRadius: "10px",
                            backgroundColor: settings.timeFormat === format ? "rgba(var(--accent-rgb), 0.15)" : "rgba(255, 255, 255, 0.05)",
                            border: settings.timeFormat === format ? "2px solid var(--accent)" : "2px solid transparent",
                            color: settings.timeFormat === format ? "var(--accent)" : "var(--foreground-muted)",
                            fontSize: "14px",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {format === "12h" ? "12-hour (AM/PM)" : "24-hour"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === "integrations" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Email Accounts */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                      <Mail style={{ width: "16px", height: "16px", display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
                      Email Accounts
                    </label>
                    <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                      Add additional email accounts to view in your Emails widget.
                    </p>

                    {/* Existing emails */}
                    {settings.connectedEmails.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {settings.connectedEmails.map((email) => (
                          <div
                            key={email}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            <span style={{ fontSize: "14px", color: "var(--foreground)" }}>{email}</span>
                            <button
                              onClick={() => handleRemoveEmail(email)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                backgroundColor: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--foreground-muted)",
                              }}
                            >
                              <Trash2 style={{ width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new email */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter email address"
                        style={{
                          flex: 1,
                          padding: "12px 16px",
                          borderRadius: "10px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--glass-border)",
                          color: "var(--foreground)",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                      />
                      <button
                        onClick={handleAddEmail}
                        disabled={!newEmail}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor: newEmail ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                          border: "none",
                          cursor: newEmail ? "pointer" : "not-allowed",
                          color: newEmail ? "var(--background)" : "var(--foreground-muted)",
                        }}
                      >
                        <Plus style={{ width: "18px", height: "18px" }} />
                      </button>
                    </div>
                  </div>

                  {/* Other integrations info */}
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                      border: "1px solid rgba(var(--accent-rgb), 0.2)",
                    }}
                  >
                    <p style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--foreground)" }}>Other integrations</strong> like Google Drive, Gmail, and Notion are managed through environment variables. Contact your administrator to update these connections.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
