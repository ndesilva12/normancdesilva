"use client";

import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { ProductivityToolNav } from "@/components/ProductivityToolNav";
import { Users } from "lucide-react";

export default function PeoplePage() {
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

          <ProductivityToolNav current="people" />

          {/* Page Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
              <Users size={48} style={{ color: "#06b6d4" }} />
              <h1 style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
              }}>
                People
              </h1>
            </div>
            <p style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "0" }}>
              Manage contacts and people
            </p>
          </div>

          {/* Content Area */}
          <div className="glass" style={{
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
          }}>
            <p style={{ fontSize: "16px", color: "#cbd5e1", lineHeight: "1.6" }}>
              This tool allows you to manage and organize your contacts and people database.
              Coming soon with more features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
