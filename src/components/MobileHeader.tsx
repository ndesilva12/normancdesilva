"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Settings, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";

export function MobileHeader() {
  const { user, signOut } = useAuth();
  const { openSettings, formatTime } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          paddingTop: "env(safe-area-inset-top)",
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(20, 184, 166, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sacramento), cursive",
                fontSize: "36px",
                color: "#14b8a6",
                lineHeight: 1,
                marginTop: "8px",
              }}
            >
              d
            </span>
          </div>
          <span style={{ fontSize: "15px", fontWeight: 600 }}>
            Dashboard
          </span>
        </Link>

        {/* Time */}
        {time && (
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#14b8a6",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(time)}
          </div>
        )}

        {/* Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: menuOpen ? "rgba(255, 255, 255, 0.1)" : "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          {menuOpen ? (
            <X style={{ width: "24px", height: "24px" }} />
          ) : (
            <Menu style={{ width: "24px", height: "24px" }} />
          )}
        </button>
      </header>

      {/* Slide-out Menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              zIndex: 1001,
              paddingTop: "60px",
            }}
          />

          {/* Menu Panel */}
          <div
            style={{
              position: "fixed",
              top: "60px",
              right: 0,
              bottom: 0,
              width: "280px",
              background: "#0a0a0a",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              zIndex: 1002,
              padding: "24px",
              overflowY: "auto",
              paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
            }}
          >
            {/* User Info */}
            {user && (
              <div
                style={{
                  marginBottom: "32px",
                  paddingBottom: "24px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    width={56}
                    height={56}
                    style={{ borderRadius: "50%", marginBottom: "12px" }}
                  />
                )}
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                  {user.displayName || "User"}
                </div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                  {user.email}
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => {
                  openSettings();
                  setMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 500,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <Settings style={{ width: "20px", height: "20px", color: "#14b8a6" }} />
                Settings
              </button>

              <button
                onClick={() => {
                  signOut();
                  setMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 500,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <LogOut style={{ width: "20px", height: "20px", color: "#f87171" }} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
