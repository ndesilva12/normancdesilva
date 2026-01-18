"use client";

import { useState, useEffect } from "react";
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
  UserPlus,
  Trash2,
  Loader2,
  RefreshCw,
  Pipette,
} from "lucide-react";
import { useSettings, THEME_COLORS, TIMEZONES, ThemeMode, TimeFormat } from "@/contexts/SettingsContext";

type SettingsTab = "appearance" | "time" | "integrations";

interface GoogleAccount {
  email: string;
  name?: string;
  picture?: string;
}

export function SettingsPopup() {
  const { settings, updateSettings, isSettingsOpen, closeSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [customColor, setCustomColor] = useState(settings.themeColor);

  // Sync custom color with settings
  useEffect(() => {
    setCustomColor(settings.themeColor);
  }, [settings.themeColor]);

  const isCustomColor = !THEME_COLORS.some(c => c.value === settings.themeColor);

  // Fetch connected Google accounts when integrations tab is shown
  useEffect(() => {
    if (isSettingsOpen && activeTab === "integrations") {
      fetchGoogleAccounts();
    }
  }, [isSettingsOpen, activeTab]);

  const fetchGoogleAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetch("/api/auth/google/accounts");
      const data = await response.json();
      setGoogleAccounts(data.accounts || []);
    } catch (err) {
      console.error("Failed to fetch Google accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleAddGoogleAccount = async () => {
    try {
      const returnUrl = encodeURIComponent(window.location.pathname);
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}&addAccount=true`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to add account:", err);
    }
  };

  const handleRemoveGoogleAccount = async (email: string) => {
    if (!confirm(`Remove ${email} from connected accounts?`)) return;

    try {
      const response = await fetch(`/api/auth/google/accounts?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setGoogleAccounts((prev) => prev.filter((a) => a.email !== email));
      }
    } catch (err) {
      console.error("Failed to remove account:", err);
    }
  };

  const handleReauthorize = async () => {
    try {
      const returnUrl = encodeURIComponent(window.location.pathname);
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}&reauthorize=true`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to reauthorize:", err);
    }
  };

  if (!isSettingsOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "time", label: "Time & Date", icon: Clock },
    { id: "integrations", label: "Integrations", icon: Link2 },
  ];

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
              top: "24px",
              left: "16px",
              right: "16px",
              bottom: "24px",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
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

                    {/* Custom Color Picker */}
                    <div style={{ marginTop: "16px", padding: "16px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "12px" }}>
                        <Pipette style={{ width: "14px", height: "14px" }} />
                        Custom Color
                      </label>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ position: "relative" }}>
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => {
                              setCustomColor(e.target.value);
                              updateSettings({ themeColor: e.target.value });
                            }}
                            style={{
                              width: "48px",
                              height: "48px",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                              backgroundColor: "transparent",
                            }}
                          />
                          {isCustomColor && (
                            <div style={{
                              position: "absolute",
                              bottom: "2px",
                              right: "2px",
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              backgroundColor: "var(--accent)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                              <Check style={{ width: "10px", height: "10px", color: "#000" }} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomColor(val);
                              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                updateSettings({ themeColor: val });
                              }
                            }}
                            placeholder="#00d4ff"
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid var(--glass-border)",
                              color: "var(--foreground)",
                              fontSize: "13px",
                              fontFamily: "monospace",
                              outline: "none",
                            }}
                          />
                          <p style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                            Enter any hex color code
                          </p>
                        </div>
                      </div>
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
                  {/* Google Accounts */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                      <Mail style={{ width: "16px", height: "16px", display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
                      Connected Google Accounts
                    </label>
                    <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                      Connect multiple Google accounts to view emails from all your inboxes.
                    </p>

                    {/* Loading state */}
                    {loadingAccounts && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                        <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                      </div>
                    )}

                    {/* Connected accounts */}
                    {!loadingAccounts && googleAccounts.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {googleAccounts.map((account) => (
                          <div
                            key={account.email}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            {account.picture ? (
                              <img
                                src={account.picture}
                                alt=""
                                style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                              />
                            ) : (
                              <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "var(--accent)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                                <Mail style={{ width: "16px", height: "16px", color: "var(--background)" }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                                {account.name || account.email.split("@")[0]}
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--foreground-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {account.email}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveGoogleAccount(account.email)}
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
                              title="Remove account"
                            >
                              <Trash2 style={{ width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No accounts message */}
                    {!loadingAccounts && googleAccounts.length === 0 && (
                      <div style={{
                        padding: "20px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        textAlign: "center",
                        marginBottom: "16px",
                      }}>
                        <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                          No Google accounts connected yet.
                        </p>
                      </div>
                    )}

                    {/* Add account button */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={handleAddGoogleAccount}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          flex: 1,
                          padding: "12px 16px",
                          borderRadius: "10px",
                          backgroundColor: "var(--accent)",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--background)",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        <UserPlus style={{ width: "16px", height: "16px" }} />
                        {googleAccounts.length > 0 ? "Add Account" : "Connect Google"}
                      </button>
                      {googleAccounts.length > 0 && (
                        <button
                          onClick={handleReauthorize}
                          title="Refresh permissions to enable new features like sending emails"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--glass-border)",
                            cursor: "pointer",
                            color: "var(--foreground)",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          <RefreshCw style={{ width: "16px", height: "16px" }} />
                          Refresh Permissions
                        </button>
                      )}
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
                      <strong style={{ color: "var(--foreground)" }}>Tip:</strong> Connected accounts will be used for Gmail, Google Calendar, Google Drive, and Google Contacts integrations.
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
