"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, Move } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";

export function LayoutEditor() {
  const { isEditMode, exitEditMode, resetLayout } = useLayout();

  if (!isEditMode) return null;

  return (
    <AnimatePresence>
      {isEditMode && (
        <>
          {/* Top banner */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: "linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(26, 26, 26, 0.95) 100%)",
              borderBottom: "1px solid var(--accent)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              {/* Left: Title and instructions */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                  }}
                >
                  <Move style={{ width: "18px", height: "18px", color: "var(--background)" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                    Layout Editor
                  </h2>
                  <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: 0 }}>
                    Drag to reorder • Click size to resize • Toggle visibility
                  </p>
                </div>
              </div>

              {/* Right: Action buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={resetLayout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground-muted)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <RotateCcw style={{ width: "14px", height: "14px" }} />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  onClick={() => exitEditMode(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 100, 100, 0.1)",
                    border: "1px solid rgba(255, 100, 100, 0.2)",
                    color: "#f87171",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <X style={{ width: "14px", height: "14px" }} />
                  <span className="hidden sm:inline">Cancel</span>
                </button>

                <button
                  onClick={() => exitEditMode(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    border: "none",
                    color: "var(--background)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Check style={{ width: "14px", height: "14px" }} />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Spacer to push content down */}
          <div style={{ height: "65px" }} />

          {/* Overlay to indicate edit mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.3)",
              pointerEvents: "none",
              zIndex: 40,
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
