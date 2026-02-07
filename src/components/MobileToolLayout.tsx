"use client";

import { ReactNode, useState } from "react";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

interface MobileToolLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  backHref?: string;
  actions?: ReactNode;
  children: ReactNode;
  settings?: ReactNode;
}

export function MobileToolLayout({
  title,
  subtitle,
  icon,
  backHref = "/",
  actions,
  children,
  settings,
}: MobileToolLayoutProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "60px",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
        background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)",
      }}
    >
      {/* Tool Header */}
      <div
        style={{
          position: "sticky",
          top: "60px",
          zIndex: 50,
          background: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: subtitle ? "8px" : 0 }}>
          <Link
            href={backHref}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              textDecoration: "none",
            }}
          >
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </Link>

          {icon && (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(20, 184, 166, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          </div>

          {settings && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: showSettings ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <SettingsIcon style={{ width: "20px", height: "20px" }} />
            </button>
          )}
        </div>

        {subtitle && (
          <p
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              marginLeft: icon ? "64px" : "52px",
            }}
          >
            {subtitle}
          </p>
        )}

        {actions && (
          <div style={{ marginTop: "12px" }}>
            {actions}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && settings && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {settings}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {children}
      </div>
    </div>
  );
}
