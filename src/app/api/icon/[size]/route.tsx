import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function CursiveDLogo({ size }: { size: number }) {
  const scale = size / 512;
  const borderRadius = size * 0.188;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        borderRadius: `${borderRadius}px`,
        position: "relative",
      }}
    >
      {/* Subtle border */}
      <div
        style={{
          position: "absolute",
          inset: `${4 * scale}px`,
          borderRadius: `${84 * scale}px`,
          border: `${3 * scale}px solid rgba(6, 182, 212, 0.2)`,
        }}
      />
      {/* Cursive 'd' using SVG path rendered as text-based approximation */}
      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 100 100"
        style={{ overflow: "visible" }}
      >
        {/* Clean cursive lowercase 'd' */}
        <path
          d="M65 15 L65 85 M65 50 C65 30 50 25 40 25 C25 25 15 40 15 55 C15 70 25 85 40 85 C55 85 65 70 65 55"
          stroke="#06b6d4"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = parseInt(sizeParam, 10);

  if (isNaN(size) || size < 16 || size > 1024) {
    return new Response("Invalid size", { status: 400 });
  }

  return new ImageResponse(<CursiveDLogo size={size} />, {
    width: size,
    height: size,
  });
}
