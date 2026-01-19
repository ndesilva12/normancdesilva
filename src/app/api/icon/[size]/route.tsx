import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Load Sacramento font from Google Fonts
async function loadSacramentoFont() {
  const response = await fetch(
    "https://fonts.googleapis.com/css2?family=Sacramento&display=swap"
  );
  const css = await response.text();
  const fontUrlMatch = css.match(/src: url\(([^)]+)\)/);

  if (fontUrlMatch) {
    const fontResponse = await fetch(fontUrlMatch[1]);
    return await fontResponse.arrayBuffer();
  }

  // Fallback: fetch the font file directly
  const fontFile = await fetch(
    "https://fonts.gstatic.com/s/sacramento/v15/buEzpo6gcdjy0EiZMBUG4C0f_f5Iai0.woff2"
  );
  return await fontFile.arrayBuffer();
}

function CursiveDLogo({ size }: { size: number }) {
  const borderRadius = size * 0.188;
  // Calculate font size to fill most of the square (approximately 75% of the size)
  const fontSize = size * 0.75;

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
          inset: "1%",
          borderRadius: `${borderRadius * 0.88}px`,
          border: "1px solid rgba(6, 182, 212, 0.2)",
        }}
      />
      {/* Sacramento font lowercase 'd' */}
      <span
        style={{
          fontFamily: "Sacramento",
          fontSize: `${fontSize}px`,
          fontWeight: 400,
          color: "#06b6d4",
          lineHeight: 1,
          marginTop: `-${size * 0.05}px`,
        }}
      >
        d
      </span>
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

  // Load the Sacramento font
  const sacramentoFont = await loadSacramentoFont();

  return new ImageResponse(<CursiveDLogo size={size} />, {
    width: size,
    height: size,
    fonts: [
      {
        name: "Sacramento",
        data: sacramentoFont,
        style: "normal",
        weight: 400,
      },
    ],
  });
}
