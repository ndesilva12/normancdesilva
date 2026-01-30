"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, Move, GripVertical, Eye, EyeOff } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { useState } from "react";

export function LayoutEditor() {
  const { isEditMode, exitEditMode, resetLayout, layout, reorderWidgets, updateWidgetVisibility } = useLayout();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
                    Drag to reorder • Toggle visibility
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
                    color: "var(--foreground-muted)",
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
                    backgroundColor: "rgba(100, 255, 100, 0.1)",
                    border: "1px solid rgba(100, 255, 100, 0.2)",
                    color: "var(--foreground)",
                    fontSize: "13px",
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

          {/* Mini Ordering View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              top: "60px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "90%",
              maxWidth: "500px",
              backgroundColor: "rgba(26, 26, 26, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: "16px",
              zIndex: 999,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px", textAlign: "center" }}>
              Reorder Widgets
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {layout.previewWidgets.map((widget, index) => (
                <motion.div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: draggedIndex === index 
                      ? "rgba(255, 255, 255, 0.15)" 
                      : dragOverIndex === index 
                        ? "rgba(255, 255, 255, 0.08)" 
                        : "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    cursor: "grab",
                    userSelect: "none",
                  }}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                  whileDrag={{ cursor: "grabbing" }}
                >
                  <GripVertical style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", marginRight: "8px" }} />
                  <span style={{ flex: 1, fontSize: "14px", color: "var(--foreground)" }}>
                    {widget.id.charAt(0).toUpperCase() + widget.id.slice(1)}
                  </span>
                  <button
                    onClick={() => updateWidgetVisibility("previewWidgets", widget.id, !widget.visible)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: widget.visible ? "var(--accent)" : "var(--foreground-muted)",
                      padding: "4px",
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
            <p style={{ fontSize: "12px", color: "var(--foreground-muted)", textAlign: "center", marginTop: "12px" }}>
              Drag to reorder widgets on your dashboard
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
