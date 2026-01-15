"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Tool, categoryLabels, categoryColors } from "@/types/tool";

interface ToolCardProps {
  tool: Tool;
  index: number;
}

export function ToolCard({ tool, index }: ToolCardProps) {
  const Icon = tool.icon;
  const isDisabled = tool.status === "coming-soon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
    >
      <Link
        href={isDisabled ? "#" : tool.href}
        style={{
          display: "block",
          height: "100%",
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
        onClick={(e) => isDisabled && e.preventDefault()}
      >
        <div
          className="glass"
          style={{
            height: "100%",
            borderRadius: "16px",
            padding: "24px",
            opacity: isDisabled ? 0.5 : 1,
            transition: "all 0.3s ease-out",
          }}
        >
          {/* Header Row: Icon + Status */}
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  width: "48px",
                  height: "48px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <Icon
                  style={{
                    width: "24px",
                    height: "24px",
                    color: "var(--foreground-muted)",
                  }}
                />
              </div>
              {tool.aiPowered && (
                <Sparkles
                  style={{
                    width: "20px",
                    height: "20px",
                    color: "var(--accent)",
                  }}
                />
              )}
            </div>
            {tool.status !== "available" && (
              <span
                style={{
                  borderRadius: "9999px",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  backgroundColor:
                    tool.status === "beta"
                      ? "rgba(6, 182, 212, 0.2)"
                      : "rgba(255, 255, 255, 0.1)",
                  color:
                    tool.status === "beta"
                      ? "var(--accent)"
                      : "var(--foreground-muted)",
                }}
              >
                {tool.status === "beta" ? "Beta" : "Soon"}
              </span>
            )}
          </div>

          {/* Content */}
          <h3
            style={{
              marginBottom: "8px",
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            {tool.name}
          </h3>
          <p
            style={{
              marginBottom: "20px",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "var(--foreground-muted)",
            }}
          >
            {tool.description}
          </p>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              className={categoryColors[tool.category]}
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              {categoryLabels[tool.category]}
            </span>
            {!isDisabled && (
              <ArrowUpRight
                style={{
                  width: "20px",
                  height: "20px",
                  color: "var(--foreground-muted)",
                }}
              />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
