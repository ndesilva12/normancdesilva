"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <TopNav />
      <BottomNav />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: "24px",
          padding: "64px 24px 24px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "8px",
              }}
            >
              Settings
            </h1>
            <p style={{ fontSize: "16px", color: "var(--muted)" }}>
              Configure your dashboard preferences
            </p>
          </div>

          <div
            className="card"
            style={{
              padding: "32px",
              textAlign: "center",
            }}
          >
            <SettingsIcon style={{ width: "48px", height: "48px", color: "var(--muted)", margin: "0 auto 16px" }} />
            <p style={{ fontSize: "16px", color: "var(--muted)" }}>
              Settings coming soon
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
