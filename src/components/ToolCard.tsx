"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Tool, categoryLabels, categoryColors } from "@/types/tool";

interface ToolCardProps {
  tool: Tool;
  index: number;
  compact?: boolean;
}

export function ToolCard({ tool, index, compact = false }: ToolCardProps) {
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
            borderRadius: compact ? "10px" : "12px",
            padding: compact ? "12px" : "16px",
            opacity: isDisabled ? 0.5 : 1,
            transition: "all 0.3s ease-out",
          }}
        >
          {/* Header Row: Icon + Status */}
          <div
            style={{
              marginBottom: compact ? "8px" : "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: compact ? "6px" : "10px" }}>
              <div
                style={{
                  display: "flex",
                  width: compact ? "32px" : "40px",
                  height: compact ? "32px" : "40px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: compact ? "8px" : "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <Icon
                  style={{
                    width: compact ? "16px" : "20px",
                    height: compact ? "16px" : "20px",
                    color: "var(--foreground-muted)",
                  }}
                />
              </div>
              {tool.aiPowered && (
                <Sparkles
                  style={{
                    width: compact ? "12px" : "16px",
                    height: compact ? "12px" : "16px",
                    color: "var(--accent)",
                  }}
                />
              )}
            </div>
            {tool.status !== "available" && (
              <span
                style={{
                  borderRadius: "9999px",
                  padding: compact ? "2px 6px" : "4px 10px",
                  fontSize: compact ? "8px" : "10px",
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
              marginBottom: compact ? "4px" : "6px",
              fontSize: compact ? "13px" : "15px",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            {tool.name}
          </h3>
          {!compact && (
            <p
              style={{
                marginBottom: "12px",
                fontSize: "13px",
                lineHeight: 1.5,
                color: "var(--foreground-muted)",
              }}
            >
              {tool.description}
            </p>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: compact ? "8px" : 0,
            }}
          >
            <span
              className={categoryColors[tool.category]}
              style={{ fontSize: compact ? "10px" : "12px", fontWeight: 500 }}
            >
              {categoryLabels[tool.category]}
            </span>
            {!isDisabled && (
              <ArrowUpRight
                style={{
                  width: compact ? "12px" : "16px",
                  height: compact ? "12px" : "16px",
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
