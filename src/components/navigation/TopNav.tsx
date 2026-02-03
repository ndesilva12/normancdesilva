"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, MessageSquare, Settings } from "lucide-react";

export function TopNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "rgba(10, 10, 10, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--glass-border)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          height: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--foreground)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          Norman
        </Link>

        {/* Main Nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <NavLink href="/" icon={Search} label="Home" active={isActive("/")} />
          <NavLink href="/jimmy" icon={MessageSquare} label="Jimmy" active={isActive("/jimmy")} />
          <NavLink href="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: 600,
        color: active ? "var(--foreground)" : "var(--muted)",
        background: active ? "var(--glass-bg)" : "transparent",
        border: active ? "1px solid var(--glass-border)" : "1px solid transparent",
        textDecoration: "none",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--foreground)";
          e.currentTarget.style.background = "var(--glass-bg)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon style={{ width: "18px", height: "18px" }} />
      <span>{label}</span>
    </Link>
  );
}
