import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function DashboardIcon({ size }: { size: number }) {
  const innerSize = size * 0.75;
  const borderRadius = size * 0.188; // ~18.8%
  const innerRadius = size * 0.125;
  const rectSize = innerSize * 0.344;
  const rectRadius = innerSize * 0.0625;
  const padding = innerSize * 0.094;
  const gap = innerSize * 0.469;

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
      }}
    >
      <div
        style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: `${padding}px`,
          padding: `${padding}px`,
          borderRadius: `${innerRadius}px`,
          border: "2px solid rgba(6, 182, 212, 0.5)",
          background: "rgba(6, 182, 212, 0.1)",
        }}
      >
        <div
          style={{
            width: `${rectSize}px`,
            height: `${rectSize}px`,
            borderRadius: `${rectRadius}px`,
            background: "#06b6d4",
          }}
        />
        <div
          style={{
            width: `${rectSize}px`,
            height: `${rectSize}px`,
            borderRadius: `${rectRadius}px`,
            background: "rgba(6, 182, 212, 0.6)",
          }}
        />
        <div
          style={{
            width: `${rectSize}px`,
            height: `${rectSize}px`,
            borderRadius: `${rectRadius}px`,
            background: "rgba(6, 182, 212, 0.4)",
          }}
        />
        <div
          style={{
            width: `${rectSize}px`,
            height: `${rectSize}px`,
            borderRadius: `${rectRadius}px`,
            background: "rgba(6, 182, 212, 0.2)",
          }}
        />
      </div>
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

  return new ImageResponse(<DashboardIcon size={size} />, {
    width: size,
    height: size,
  });
}
