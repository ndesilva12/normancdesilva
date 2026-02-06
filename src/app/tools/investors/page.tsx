"use client";

import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { IntelToolNav } from "@/components/IntelToolNav";
import { TrendingDown } from "lucide-react";

export default function InvestorsPage() {
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

          <IntelToolNav current="investors" />

          {/* Page Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
              <TrendingDown size={48} style={{ color: "#3b82f6" }} />
              <h1 style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
              }}>
                Investors
              </h1>
            </div>
            <p style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "0" }}>
              Fundraising pipeline and investor tracking
            </p>
          </div>

          {/* Content Area */}
          <div className="glass" style={{
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
          }}>
            <p style={{ fontSize: "16px", color: "#cbd5e1", lineHeight: "1.6" }}>
              This tool tracks your fundraising pipeline and investor relationships.
              Coming soon with more features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
