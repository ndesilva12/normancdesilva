"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function MobileActionSheet({ isOpen, onClose, title, children }: MobileActionSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "85vh",
          background: "#0a0a0a",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          zIndex: 1001,
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            padding: "12px 0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px 16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            maxHeight: "calc(85vh - 80px)",
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

interface MobileActionItemProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  destructive?: boolean;
}

export function MobileActionItem({
  icon,
  label,
  description,
  onClick,
  destructive = false,
}: MobileActionItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        marginBottom: "8px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = "scale(0.98)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
      }}
    >
      {icon && (
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: destructive ? "rgba(239, 68, 68, 0.1)" : "rgba(20, 184, 166, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: destructive ? "#ef4444" : "#14b8a6",
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: destructive ? "#ef4444" : "#ffffff",
            marginBottom: description ? "4px" : 0,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: "13px",
              color: "#94a3b8",
            }}
          >
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
