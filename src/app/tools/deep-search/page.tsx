"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Radar, Clock, Zap, Globe, Database, Shield } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

export default function DeepSearchPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            margin: "0 auto",
            padding: "32px 24px 100px 24px",
          }}
        >
          <RemindersBanner />

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "32px", textAlign: "center" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                marginBottom: "24px",
              }}
            >
              <Radar style={{ width: "40px", height: "40px", color: "var(--accent)" }} />
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "12px",
              }}
            >
              Deep Search
            </h1>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "20px",
                backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                marginBottom: "16px",
              }}
            >
              <Clock style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--accent)" }}>Coming Soon</span>
            </div>
            <p style={{ fontSize: "16px", color: "var(--foreground-muted)", maxWidth: "500px", margin: "0 auto" }}>
              Advanced multi-source deep web search for comprehensive research and investigation
            </p>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "24px" }}>
              Planned Features
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Globe style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Multi-Source Search
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Search across multiple specialized databases, archives, and indexed sources simultaneously
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Database style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Deep Web Indexing
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Access content not indexed by traditional search engines, including academic papers, archives, and more
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Zap style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    AI-Powered Analysis
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Intelligent result aggregation and analysis to surface the most relevant information
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Shield style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Privacy-Focused
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Secure, private searches with no tracking or data collection
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Use Cases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Use Cases
            </h2>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Academic and scientific research
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Investigative journalism
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                OSINT (Open Source Intelligence) gathering
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Historical archive searches
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Comprehensive background research
              </li>
            </ul>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
