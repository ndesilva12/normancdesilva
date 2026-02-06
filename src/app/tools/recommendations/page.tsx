"use client";

import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { ProductivityToolNav } from "@/components/ProductivityToolNav";
import { Handshake } from "lucide-react";

export default function RecommendationsPage() {
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

          <ProductivityToolNav current="recommendations" />

          {/* Page Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
              <Handshake size={48} style={{ color: "#ec4899" }} />
              <h1 style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
              }}>
                Recommendations
              </h1>
            </div>
            <p style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "0" }}>
              Track suggestions and recommendations
            </p>
          </div>

          {/* Content Area */}
          <div className="glass" style={{
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
          }}>
            <p style={{ fontSize: "16px", color: "#cbd5e1", lineHeight: "1.6" }}>
              This tool allows you to track and manage recommendations.
              Coming soon with more features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
