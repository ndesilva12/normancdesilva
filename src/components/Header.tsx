"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, LogIn, LogOut, LayoutGrid, Calendar, TrendingUp, Bell, ChevronDown, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Reminders } from "@/components/Actions";

export function Header({
  isGoogleConnected = false,
  onConnectGoogle,
}: {
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
}) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { enterEditMode, isEditMode } = useLayout();
  const { openSettings, formatTime, formatDate } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Update time every second
  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDateStr = dateTime ? formatDate(dateTime, {
    weekday: isMobile ? "short" : "long",
    month: isMobile ? "short" : "long",
    day: "numeric",
  }) : "";

  const formattedTimeStr = dateTime ? formatTime(dateTime) : "";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        width: "100%",
        backdropFilter: "blur(20px)",
        backgroundColor: "rgba(10, 10, 15, 0.85)",
        borderBottom: "1px solid var(--glass-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        {/* Left: Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(var(--accent-rgb), 0.1)",
            }}
          >
            <LayoutDashboard style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
          </div>
          <span
            className="hidden sm:inline"
            style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            The <span style={{ color: "var(--accent)" }}>Dashboard</span>
          </span>
        </Link>

        {/* Center: Date/Time - Hidden on mobile */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {dateTime && (
              <>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formattedDateStr}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 400,
                    color: "var(--accent)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formattedTimeStr}
                </span>
              </>
            )}
          </div>
        )}

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Trending Button */}
          <Link
            href="/tools/trending"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--foreground-muted)",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
            title="Trending"
          >
            <TrendingUp style={{ width: "18px", height: "18px" }} />
          </Link>

          {/* Calendar Button */}
          <Link
            href="/tools/calendar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--foreground-muted)",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
            title="Calendar"
          >
            <Calendar style={{ width: "18px", height: "18px" }} />
          </Link>

          {/* Reminders */}
          {user && (
            <Reminders
              isGoogleConnected={isGoogleConnected}
              onConnectGoogle={onConnectGoogle}
            />
          )}

          {/* User Menu */}
          {loading ? (
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                animation: "pulse 2s infinite",
              }}
            />
          ) : user ? (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 8px 4px 4px",
                  borderRadius: "8px",
                  backgroundColor: menuOpen ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--accent)",
                    }}
                  >
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <ChevronDown
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "var(--foreground-muted)",
                    transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                  className="hidden sm:block"
                />
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    minWidth: "200px",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "8px",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                    zIndex: 200,
                  }}
                >
                  {/* User Info */}
                  <div
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                      {user.displayName || "User"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                      {user.email}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      enterEditMode();
                      setMenuOpen(false);
                    }}
                    disabled={isEditMode}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: isEditMode ? "var(--foreground-muted)" : "var(--foreground)",
                      fontSize: "14px",
                      cursor: isEditMode ? "not-allowed" : "pointer",
                      opacity: isEditMode ? 0.5 : 1,
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isEditMode) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <LayoutGrid style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                    <span>Customize Layout</span>
                  </button>

                  <button
                    onClick={() => {
                      openSettings();
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Settings style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                    <span>Settings</span>
                  </button>

                  <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />

                  <button
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <LogOut style={{ width: "18px", height: "18px", color: "#f87171" }} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "var(--accent)",
                border: "none",
                color: "var(--background)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
            >
              <LogIn style={{ width: "16px", height: "16px" }} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
