"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Moon, Clock, Eye, Lock, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

export default function DarkSearchPage() {
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
              <Moon style={{ width: "40px", height: "40px", color: "var(--accent)" }} />
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "12px",
              }}
            >
              Dark Search
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
              Explore indexed dark web content for research and security intelligence
            </p>
          </motion.div>

          {/* Warning Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              gap: "12px",
            }}
          >
            <AlertTriangle style={{ width: "20px", height: "20px", color: "#f59e0b", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#fbbf24", marginBottom: "4px" }}>
                For Research Purposes Only
              </p>
              <p style={{ fontSize: "13px", color: "rgba(251, 191, 36, 0.8)" }}>
                This tool is designed for legitimate security research, threat intelligence, and academic purposes.
              </p>
            </div>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
                  <Search style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Indexed Dark Web Search
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Search through indexed .onion sites and dark web content without direct access
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
                  <Eye style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Threat Intelligence
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Monitor for data breaches, leaked credentials, and security threats
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
                  <Lock style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Secure Access
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Search indexed content safely without directly accessing dark web services
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
                  <Moon style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Historical Archives
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    Access archived dark web content for research and analysis
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Use Cases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Legitimate Use Cases
            </h2>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Cybersecurity threat research
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Data breach monitoring
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Academic research on internet anonymity
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Journalism and investigative reporting
              </li>
              <li style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Law enforcement intelligence (with proper authorization)
              </li>
            </ul>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
