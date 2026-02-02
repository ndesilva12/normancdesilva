"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, Move, GripVertical, Eye, EyeOff } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { useState, useEffect } from "react";

export function LayoutEditor() {
  const { isEditMode, exitEditMode, resetLayout, layout, reorderWidgets, updateWidgetVisibility, isMobile } = useLayout();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // For touch drag on mobile
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);

  if (!isEditMode) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderWidgets("previewWidgets", draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Mobile-friendly move up/down buttons
  const moveWidget = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < layout.previewWidgets.length) {
      reorderWidgets("previewWidgets", index, newIndex);
    }
  };

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
                padding: isMobile ? "10px 12px" : "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: isMobile ? "8px" : "16px",
              }}
            >
              {/* Left: Title and instructions */}
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isMobile ? "32px" : "36px",
                    height: isMobile ? "32px" : "36px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    flexShrink: 0,
                  }}
                >
                  <Move style={{ width: isMobile ? "16px" : "18px", height: isMobile ? "16px" : "18px", color: "var(--background)" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: isMobile ? "14px" : "15px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                    {isMobile ? "Edit Layout" : "Layout Editor"}
                  </h2>
                  {!isMobile && (
                    <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: 0 }}>
                      Drag to reorder • Toggle visibility
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Action buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px", flexShrink: 0 }}>
                <button
                  onClick={resetLayout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: isMobile ? "8px" : "8px 12px",
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
                  {!isMobile && <span>Reset</span>}
                </button>

                <button
                  onClick={() => exitEditMode(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: isMobile ? "8px" : "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 100, 100, 0.1)",
                    border: "1px solid rgba(255, 100, 100, 0.2)",
                    color: "var(--foreground-muted)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <X style={{ width: "14px", height: "14px" }} />
                  {!isMobile && <span>Cancel</span>}
                </button>

                <button
                  onClick={() => exitEditMode(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: isMobile ? "8px" : "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(100, 255, 100, 0.1)",
                    border: "1px solid rgba(100, 255, 100, 0.2)",
                    color: "var(--foreground)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Check style={{ width: "14px", height: "14px" }} />
                  {!isMobile && <span>Save</span>}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mini Ordering View - fixed positioning for mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              top: isMobile ? "56px" : "60px",
              left: isMobile ? "8px" : "50%",
              right: isMobile ? "8px" : "auto",
              transform: isMobile ? "none" : "translateX(-50%)",
              width: isMobile ? "auto" : "90%",
              maxWidth: "500px",
              backgroundColor: "rgba(26, 26, 26, 0.98)",
              backdropFilter: "blur(10px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: isMobile ? "12px" : "16px",
              zIndex: 999,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              maxHeight: isMobile ? "calc(100vh - 72px)" : "70vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px", textAlign: "center" }}>
              Reorder Widgets
            </h3>
            {isMobile && (
              <p style={{ fontSize: "11px", color: "var(--foreground-muted)", textAlign: "center", marginBottom: "12px" }}>
                Use arrows to reorder
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "6px" : "8px" }}>
              {layout.previewWidgets.map((widget, index) => (
                <motion.div
                  key={widget.id}
                  draggable={!isMobile}
                  onDragStart={(e) => !isMobile && handleDragStart(e as unknown as React.DragEvent, index)}
                  onDragOver={(e) => !isMobile && handleDragOver(e as unknown as React.DragEvent, index)}
                  onDrop={(e) => !isMobile && handleDrop(e as unknown as React.DragEvent, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: draggedIndex === index
                      ? "rgba(255, 255, 255, 0.15)"
                      : dragOverIndex === index
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    cursor: isMobile ? "default" : "grab",
                    userSelect: "none",
                  }}
                  whileHover={!isMobile ? { backgroundColor: "rgba(255, 255, 255, 0.08)" } : {}}
                  whileDrag={!isMobile ? { cursor: "grabbing" } : {}}
                >
                  {/* Drag handle or position number */}
                  {isMobile ? (
                    <span style={{
                      width: "24px",
                      fontSize: "12px",
                      color: "var(--foreground-muted)",
                      textAlign: "center",
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>
                  ) : (
                    <GripVertical style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", marginRight: "8px", flexShrink: 0 }} />
                  )}

                  <span style={{ flex: 1, fontSize: isMobile ? "13px" : "14px", color: "var(--foreground)", marginLeft: isMobile ? "8px" : "0" }}>
                    {widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}
                  </span>

                  {/* Mobile: Up/Down arrows */}
                  {isMobile && (
                    <div style={{ display: "flex", gap: "4px", marginRight: "8px" }}>
                      <button
                        onClick={() => moveWidget(index, "up")}
                        disabled={index === 0}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                          color: index === 0 ? "var(--glass-border)" : "var(--foreground-muted)",
                          padding: "4px",
                          fontSize: "16px",
                          lineHeight: 1,
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveWidget(index, "down")}
                        disabled={index === layout.previewWidgets.length - 1}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: index === layout.previewWidgets.length - 1 ? "not-allowed" : "pointer",
                          color: index === layout.previewWidgets.length - 1 ? "var(--glass-border)" : "var(--foreground-muted)",
                          padding: "4px",
                          fontSize: "16px",
                          lineHeight: 1,
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  )}

                  {/* Visibility toggle */}
                  <button
                    onClick={() => updateWidgetVisibility("previewWidgets", widget.id, !widget.visible)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: widget.visible ? "var(--accent)" : "var(--foreground-muted)",
                      padding: "4px",
                      flexShrink: 0,
                    }}
                  >
                    {widget.visible ? (
                      <Eye style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <EyeOff style={{ width: "16px", height: "16px" }} />
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "var(--foreground-muted)", textAlign: "center", marginTop: "12px" }}>
              {isMobile ? "Tap arrows to move, eye to show/hide" : "Drag to reorder widgets on your dashboard"}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
