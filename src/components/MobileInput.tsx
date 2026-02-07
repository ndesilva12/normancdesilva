"use client";

import { LucideIcon } from "lucide-react";

interface MobileInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  type?: string;
  multiline?: boolean;
  rows?: number;
}

export function MobileInput({
  placeholder,
  value,
  onChange,
  icon: Icon,
  type = "text",
  multiline = false,
  rows = 3,
}: MobileInputProps) {
  const baseStyles = {
    width: "100%",
    padding: Icon ? "14px 14px 14px 48px" : "14px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    fontSize: "16px", // Prevents iOS zoom on focus
    color: "#ffffff",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div style={{ position: "relative" }}>
      {Icon && (
        <Icon
          style={{
            position: "absolute",
            left: "14px",
            top: multiline ? "14px" : "50%",
            transform: multiline ? "none" : "translateY(-50%)",
            width: "20px",
            height: "20px",
            color: "#94a3b8",
          }}
        />
      )}

      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          style={{
            ...baseStyles,
            resize: "vertical",
            minHeight: "100px",
          }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...baseStyles,
            height: "48px",
          }}
        />
      )}
    </div>
  );
}

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
}

export function MobileButton({
  children,
  onClick,
  variant = "primary",
  fullWidth = false,
  disabled = false,
  icon: Icon,
  loading = false,
}: MobileButtonProps) {
  const variants = {
    primary: {
      background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
      color: "#ffffff",
      border: "none",
    },
    secondary: {
      background: "rgba(255, 255, 255, 0.05)",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    ghost: {
      background: "transparent",
      color: "#94a3b8",
      border: "none",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        width: fullWidth ? "100%" : "auto",
        minHeight: "48px",
        padding: "0 24px",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {loading ? (
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            borderTopColor: "#ffffff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      ) : (
        <>
          {Icon && <Icon style={{ width: "20px", height: "20px" }} />}
          {children}
        </>
      )}
    </button>
  );
}
