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
        className={`group relative block h-full ${isDisabled ? "cursor-not-allowed" : ""}`}
        onClick={(e) => isDisabled && e.preventDefault()}
      >
        <div
          className={`
            glass h-full rounded-2xl p-6
            transition-all duration-300 ease-out
            ${isDisabled ? "opacity-50" : "hover:bg-glass-hover hover:border-accent/20"}
          `}
        >
          {/* Header Row: Icon + Status */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`
                  flex h-12 w-12 items-center justify-center rounded-xl
                  bg-white/5 transition-colors duration-300
                  ${!isDisabled ? "group-hover:bg-accent/10" : ""}
                `}
              >
                <Icon
                  className={`
                    h-6 w-6 text-foreground-muted transition-colors duration-300
                    ${!isDisabled ? "group-hover:text-accent" : ""}
                  `}
                />
              </div>
              {tool.aiPowered && (
                <Sparkles className="h-5 w-5 text-accent" />
              )}
            </div>
            {tool.status !== "available" && (
              <span
                className={`
                  rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider
                  ${tool.status === "beta"
                    ? "bg-accent/20 text-accent"
                    : "bg-white/10 text-foreground-muted"}
                `}
              >
                {tool.status === "beta" ? "Beta" : "Soon"}
              </span>
            )}
          </div>

          {/* Content */}
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {tool.name}
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-foreground-muted">
            {tool.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${categoryColors[tool.category]}`}>
              {categoryLabels[tool.category]}
            </span>
            {!isDisabled && (
              <ArrowUpRight
                className="h-5 w-5 text-foreground-muted opacity-0 transition-all duration-300 group-hover:text-accent group-hover:opacity-100"
              />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
