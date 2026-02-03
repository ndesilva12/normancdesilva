"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NotesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Notion browser
    router.push("/tools/notion-browser");
  }, [router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--foreground-muted)" }}>Redirecting to Notion workspace...</p>
      </div>
    </div>
  );
}
