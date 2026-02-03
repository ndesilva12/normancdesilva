"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Zap, Briefcase, MessageSquare } from "lucide-react";

export function BottomNav() {
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
        bottom: 0,
        left: 0,
        right: 0,
        height: "72px",
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--glass-border)",
        zIndex: 1000,
        display: "none",
      }}
      className="mobile-bottom-nav"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          height: "100%",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <NavItem href="/" icon={Search} label="Home" active={isActive("/")} />
        <NavItem href="/intel" icon={Zap} label="Intel" active={isActive("/intel")} />
        <NavItem href="/productivity" icon={Briefcase} label="Tools" active={isActive("/productivity")} />
        <NavItem href="/jimmy" icon={MessageSquare} label="Jimmy" active={isActive("/jimmy")} />
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .mobile-bottom-nav {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}

function NavItem({
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        color: active ? "var(--accent)" : "var(--muted)",
        textDecoration: "none",
        transition: "all 0.2s",
        padding: "8px",
      }}
    >
      <Icon
        style={{
          width: "24px",
          height: "24px",
          strokeWidth: active ? 2.5 : 2,
        }}
      />
      <span
        style={{
          fontSize: "12px",
          fontWeight: active ? 600 : 500,
        }}
      >
        {label}
      </span>
    </Link>
  );
}
