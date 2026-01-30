import { ExternalLink } from "lucide-react";

export function OpenSourceButton({
  href,
  label = "Open Source",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "10px 16px",
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid var(--glass-border)",
        borderRadius: "8px",
        color: "var(--foreground)",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 500,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {label}
      <ExternalLink style={{ width: "14px", height: "14px" }} />
    </a>
  );
}
