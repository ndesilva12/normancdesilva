"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MessageSquare } from "lucide-react";

export default function JimmyPage() {
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
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <MessageSquare style={{ width: "40px", height: "40px", color: "var(--accent)" }} />
            </div>

            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "12px",
              }}
            >
              Jimmy Chat
            </h1>

            <p
              style={{
                fontSize: "16px",
                color: "var(--muted)",
                marginBottom: "32px",
                lineHeight: 1.6,
              }}
            >
              Your AI assistant. Coming soon.
            </p>

            <div
              className="card"
              style={{
                padding: "24px",
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "8px" }}>
                For now, you can reach Jimmy via:
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                <li style={{ fontSize: "14px", color: "var(--foreground)", padding: "8px 0" }}>
                  📱 iMessage (prefix messages with "jimmy")
                </li>
                <li style={{ fontSize: "14px", color: "var(--foreground)", padding: "8px 0" }}>
                  💬 Telegram
                </li>
                <li style={{ fontSize: "14px", color: "var(--foreground)", padding: "8px 0" }}>
                  🖥️ Web chat (this interface)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
