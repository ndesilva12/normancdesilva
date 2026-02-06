"use client";

import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { IntelToolNav } from "@/components/IntelToolNav";
import { Target } from "lucide-react";

export default function MissionPage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)",
      width: "100%"
    }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1200px", width: "90%", margin: "0 auto", padding: "32px 20px" }}>
          <RemindersBanner />

          <IntelToolNav current="mission" />

          {/* Page Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
              <Target size={48} style={{ color: "#f59e0b" }} />
              <h1 style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
              }}>
                Mission
              </h1>
            </div>
            <p style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "0" }}>
              Task and mission management
            </p>
          </div>

          {/* Content Area */}
          <div className="glass" style={{
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
          }}>
            <p style={{ fontSize: "16px", color: "#cbd5e1", lineHeight: "1.6" }}>
              This tool provides task and mission management capabilities.
              Coming soon with more features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
