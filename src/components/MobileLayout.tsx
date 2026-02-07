"use client";

import { ReactNode, useEffect, useState } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
import { Header } from "./Header";

export function MobileLayout({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          paddingTop: "60px",
          paddingBottom: "80px",
          background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <MobileHeader />
        <main>{children}</main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />
      <main>{children}</main>
    </div>
  );
}
