"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { IntelToolsBar } from "@/components/home/IntelToolsBar";
import { QuickAccessDock } from "@/components/home/QuickAccessDock";
import { RemindersBanner } from "@/components/RemindersBanner";
import { useEffect, useState } from "react";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: isMobile ? "88px" : "24px",
          padding: isMobile ? "64px 12px 88px 12px" : "64px 24px 24px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Reminders */}
          <RemindersBanner />

          {/* Date/Time (mobile only) */}
          {isMobile && <MobileDateTimeBanner />}

          {/* Search */}
          <div style={{ marginBottom: "32px" }}>
            <MultiSourceSearch />
          </div>

          {/* Intel Tools Bar */}
          <IntelToolsBar />

          {/* Quick Access Dock */}
          <QuickAccessDock />
          
          {/* Preview Section for Tools */}
          <div
            style={{
              marginTop: "32px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              padding: "16px",
              minHeight: "300px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                marginBottom: "12px",
              }}
            >
              Preview
            </h2>
            <div id="preview-content">
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>Click a tool to see a preview.</p>
            </div>
            <button
              id="view-full-tool"
              style={{
                display: "none",
                marginTop: "16px",
                background: "var(--accent)",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              View Full Tool
            </button>
          </div>
        </div>
      </div>
      
      {/* Add script for preview functionality */}
      {typeof window !== 'undefined' && (
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', () => {
              const toolButtons = document.querySelectorAll('.card');
              const previewContent = document.getElementById('preview-content');
              const viewFullToolButton = document.getElementById('view-full-tool');
              let currentToolUrl = null;

              // Mock preview data
              const previewData = {
                emails: { content: '<div class="widget-preview"><h3>Email Widget</h3><p><strong>Unread Emails:</strong> 3</p><p>Latest: "Meeting Tomorrow" from John Doe</p></div>', url: '/tools/emails' },
                trending: { content: '<div class="widget-preview"><h3>Trending Widget</h3><p><strong>Top Topics:</strong> AI, Crypto, Tech Stocks</p></div>', url: '/tools/trending' },
                inoreader: { content: '<div class="widget-preview"><h3>Reader Widget</h3><p><strong>Latest Articles:</strong> "AI Breakthroughs 2026", "Market Analysis"</p></div>', url: '/tools/inoreader' },
                news: { content: '<div class="widget-preview"><h3>News Widget</h3><p><strong>Top Stories:</strong> Global Tech Summit, New Policy Impact</p></div>', url: '/tools/news' }
              };

              // Click event for tool buttons
              toolButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                  const href = button.getAttribute('href');
                  const toolId = href.split('/').pop();
                  if (previewData[toolId]) {
                    e.preventDefault();
                    previewContent.innerHTML = previewData[toolId].content;
                    viewFullToolButton.style.display = 'block';
                    currentToolUrl = previewData[toolId].url;
                    // Highlight clicked button
                    toolButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                  }
                });
              });

              // Click event for 'View Full Tool'
              viewFullToolButton.addEventListener('click', () => {
                if (currentToolUrl) {
                  window.location.href = currentToolUrl;
                }
              });

              // CSS for active state and widget styling
              const style = document.createElement('style');
              style.textContent = '.card.active { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); } .widget-preview { background: rgba(255, 255, 255, 0.08); padding: 16px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.15); } .widget-preview h3 { margin-top: 0; color: var(--accent); }';
              document.head.appendChild(style);
            });
          `,
        }} />
      )}
    </>
  );
}

function MobileDateTimeBanner() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  const dateStr = dateTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const timeStr = dateTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "16px 0",
        marginBottom: "16px",
      }}
    >
      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
        {dateStr}
      </span>
      <span style={{ fontSize: "15px", fontWeight: 400, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
        {timeStr}
      </span>
    </div>
  );
}
