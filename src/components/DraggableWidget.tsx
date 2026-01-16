"use client";

import { useState, useRef, ReactNode } from "react";
import { GripVertical, Minimize2, Maximize2, Square, Eye, EyeOff } from "lucide-react";
import { useLayout, WidgetSize } from "@/contexts/LayoutContext";

interface DraggableWidgetProps {
  id: string;
  type: "previewWidgets" | "toolCards";
  title: string;
  index: number;
  children: ReactNode;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export function DraggableWidget({
  id,
  type,
  title,
  index,
  children,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: DraggableWidgetProps) {
  const { isEditMode, getWidgetConfig, updateWidgetSize, updateWidgetVisibility } = useLayout();
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const config = getWidgetConfig(type, id);
  const size = config?.size || "default";
  const visible = config?.visible ?? true;

  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(index);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const handleSizeChange = (newSize: WidgetSize) => {
    updateWidgetSize(type, id, newSize);
    setShowSizeMenu(false);
  };

  const handleVisibilityToggle = () => {
    updateWidgetVisibility(type, id, !visible);
  };

  // Size-based styles
  const getSizeStyles = () => {
    if (!isEditMode) {
      // In normal mode, only apply size if not collapsed
      if (size === "collapsed") {
        return { maxHeight: "60px", overflow: "hidden" };
      }
      return {};
    }

    // In edit mode, show collapsed view
    return { maxHeight: "60px", overflow: "hidden" };
  };

  // Grid span styles based on size (for expanded)
  const getGridStyles = (): React.CSSProperties => {
    if (size === "expanded") {
      return { gridColumn: "span 2 / span 2" };
    }
    return {};
  };

  const isBeingDraggedOver = dragOverIndex === index && isDragging;

  if (isEditMode) {
    // Edit mode: collapsed tiles with controls
    return (
      <div
        ref={widgetRef}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={(e) => e.preventDefault()}
        className="glass"
        style={{
          borderRadius: "12px",
          opacity: visible ? 1 : 0.5,
          transform: isBeingDraggedOver ? "scale(1.02)" : "scale(1)",
          transition: "transform 0.15s, opacity 0.15s, box-shadow 0.15s",
          boxShadow: isBeingDraggedOver ? "0 0 0 2px var(--accent)" : "none",
          cursor: "grab",
          ...getGridStyles(),
        }}
      >
        {/* Collapsed header with controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
          }}
        >
          {/* Drag handle */}
          <GripVertical
            style={{
              width: "18px",
              height: "18px",
              color: "var(--foreground-muted)",
              cursor: "grab",
              flexShrink: 0,
            }}
          />

          {/* Title */}
          <span
            style={{
              flex: 1,
              fontSize: "14px",
              fontWeight: 600,
              color: visible ? "var(--foreground)" : "var(--foreground-muted)",
            }}
          >
            {title}
          </span>

          {/* Size selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowSizeMenu(!showSizeMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "none",
                color: "var(--foreground-muted)",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              {size === "collapsed" && <Minimize2 style={{ width: "12px", height: "12px" }} />}
              {size === "default" && <Square style={{ width: "12px", height: "12px" }} />}
              {size === "expanded" && <Maximize2 style={{ width: "12px", height: "12px" }} />}
              <span style={{ textTransform: "capitalize" }}>{size}</span>
            </button>

            {showSizeMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "4px",
                  backgroundColor: "#1c1c1c",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "4px",
                  zIndex: 100,
                  minWidth: "120px",
                }}
              >
                <button
                  onClick={() => handleSizeChange("collapsed")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    backgroundColor: size === "collapsed" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Minimize2 style={{ width: "14px", height: "14px" }} />
                  Collapsed
                </button>
                <button
                  onClick={() => handleSizeChange("default")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    backgroundColor: size === "default" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Square style={{ width: "14px", height: "14px" }} />
                  Default
                </button>
                <button
                  onClick={() => handleSizeChange("expanded")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    backgroundColor: size === "expanded" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Maximize2 style={{ width: "14px", height: "14px" }} />
                  Expanded
                </button>
              </div>
            )}
          </div>

          {/* Visibility toggle */}
          <button
            onClick={handleVisibilityToggle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: visible ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 100, 100, 0.1)",
              border: "none",
              color: visible ? "var(--foreground-muted)" : "#f87171",
              cursor: "pointer",
            }}
            title={visible ? "Hide widget" : "Show widget"}
          >
            {visible ? <Eye style={{ width: "14px", height: "14px" }} /> : <EyeOff style={{ width: "14px", height: "14px" }} />}
          </button>
        </div>
      </div>
    );
  }

  // Normal mode: render children with size adjustments
  if (!visible) return null;

  return (
    <div
      style={{
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        ...getSizeStyles(),
        ...getGridStyles(),
        transition: "max-height 0.3s ease",
      }}
    >
      {children}
    </div>
  );
}

// Hook for managing drag state in parent
export function useDragState() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDragIndex(index);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return {
    isDragging,
    dragIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
