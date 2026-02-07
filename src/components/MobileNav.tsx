"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brain, Users, MessageSquare, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/tools/curate", icon: Brain, label: "Intel" },
    { href: "/tools/people", icon: Users, label: "People" },
    { href: "/tools/jimmy", icon: MessageSquare, label: "Jimmy" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "80px",
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 1000,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "8px 16px",
              textDecoration: "none",
              minWidth: "60px",
              color: active ? "#14b8a6" : "#94a3b8",
              transition: "all 0.2s ease",
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
                fontSize: "11px",
                fontWeight: active ? 600 : 500,
                letterSpacing: "0.5px",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
