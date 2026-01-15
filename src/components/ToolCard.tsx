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
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={isDisabled ? "#" : tool.href}
        className={`group relative block h-full ${isDisabled ? "cursor-not-allowed" : ""}`}
        onClick={(e) => isDisabled && e.preventDefault()}
      >
        <div
          className={`
            glass glass-hover h-full rounded-2xl p-6
            transition-all duration-300 ease-out
            ${isDisabled ? "opacity-50" : ""}
            ${!isDisabled ? "hover:scale-[1.02] hover:accent-glow" : ""}
          `}
        >
          {/* Status Badge */}
          {tool.status !== "available" && (
            <div className="absolute right-4 top-4">
              <span
                className={`
                  rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider
                  ${tool.status === "beta"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-white/5 text-foreground-muted"}
                `}
              >
                {tool.status === "beta" ? "Beta" : "Soon"}
              </span>
            </div>
          )}

          {/* Icon */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className={`
                flex h-12 w-12 items-center justify-center rounded-xl
                bg-white/5 transition-colors duration-300
                ${!isDisabled ? "group-hover:bg-cyan-500/10" : ""}
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
              <Sparkles className="h-4 w-4 text-cyan-400" />
            )}
          </div>

          {/* Content */}
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {tool.name}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-foreground-muted">
            {tool.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${categoryColors[tool.category]}`}>
              {categoryLabels[tool.category]}
            </span>
            {!isDisabled && (
              <ArrowUpRight
                className="h-4 w-4 text-foreground-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent group-hover:opacity-100"
              />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
