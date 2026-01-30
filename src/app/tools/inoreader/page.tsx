"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Rss,
  Loader2,
  ExternalLink,
  Folder,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { OpenSourceButton } from "@/components/OpenSourceButton";

export default function InoreaderPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "16px" : "20px" }}>
          <RemindersBanner />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                textDecoration: "none",
              }}
            >
              <ArrowLeft style={{ width: "20px", height: "20px" }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <Rss style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>
                  RSS Reader
                </h1>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Read and organize your RSS feeds from Inoreader
              </p>
            </div>
            <OpenSourceButton href="https://www.inoreader.com" label="Open Inoreader" />
          </motion.div>

          {/* Setup Required Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass"
            style={{
              borderRadius: "12px",
              padding: isMobile ? "40px 20px" : "60px 40px",
              textAlign: "center",
            }}
          >
            <Rss style={{ width: "64px", height: "64px", color: "var(--accent)", margin: "0 auto 24px", opacity: 0.7 }} />
            
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
              Inoreader Integration Coming Soon
            </h2>
            
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px", maxWidth: "500px", margin: "0 auto 24px" }}>
              Connect your Inoreader account to read and organize your RSS feeds directly from the dashboard.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px", margin: "0 auto" }}>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                  Features (When Enabled):
                </h3>
                <ul style={{ fontSize: "13px", color: "var(--foreground-muted)", textAlign: "left", lineHeight: "1.8" }}>
                  <li>Read articles from your RSS subscriptions</li>
                  <li>Organize feeds into folders and tags</li>
                  <li>Mark articles as read/unread</li>
                  <li>Star important articles</li>
                  <li>Full-text search across all feeds</li>
                  <li>Sync with your Inoreader account</li>
                </ul>
              </div>

              <a
                href="https://www.inoreader.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Visit Inoreader
                <ExternalLink style={{ width: "16px", height: "16px" }} />
              </a>

              <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                Inoreader API authentication will be configured by your admin
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
