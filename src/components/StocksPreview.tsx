"use client";

import { useEffect, useRef, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, ExternalLink } from "lucide-react";
// User's TradingView watchlist symbols
// Note: Removed VIX, DXY, US10Y, US30Y as they don't display in Market Overview widget
const WATCHLIST_SYMBOLS = [
  { s: "CAPITALCOM:US500" },
  { s: "AMEX:SPY" },
  { s: "NASDAQ:QQQ" },
  { s: "AMEX:IWM" },
  { s: "NYSE:BSX" },
  { s: "TVC:GOLD" },
  { s: "TVC:SILVER" },
  { s: "NASDAQ:TLT" },
  { s: "COINBASE:BTCUSD" },
  { s: "FX:USDJPY" },
  { s: "NASDAQ:TSLA" },
  { s: "AMEX:GLD" },
  { s: "AMEX:SLV" },
  { s: "NYMEX:CL1!" },
  { s: "AMEX:XLE" },
  { s: "NYSE:GME" },
  { s: "NYSE:CVNA" },
  { s: "NYSE:KSS" },
  { s: "NYSE:RKT" },
  { s: "NASDAQ:HTZ" },
  { s: "NASDAQ:GRPN" },
  { s: "NASDAQ:BETR" },
  { s: "NASDAQ:OPEN" },
];

function TradingViewPreviewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = "";

    // Create the widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    // Create and append the script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: false,
      locale: "en",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      plotLineColorGrowing: "rgba(34, 197, 94, 1)",
      plotLineColorFalling: "rgba(239, 68, 68, 1)",
      gridLineColor: "rgba(240, 243, 250, 0)",
      scaleFontColor: "rgba(209, 212, 220, 1)",
      belowLineFillColorGrowing: "rgba(34, 197, 94, 0.12)",
      belowLineFillColorFalling: "rgba(239, 68, 68, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(34, 197, 94, 0)",
      belowLineFillColorFallingBottom: "rgba(239, 68, 68, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      tabs: [
        {
          title: "Watchlist",
          symbols: WATCHLIST_SYMBOLS,
        },
      ],
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
      }}
    />
  );
}

const MemoizedTradingViewWidget = memo(TradingViewPreviewWidget);

export function StocksPreview() {
  const router = useRouter();

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - clickable to navigate to market page */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          transition: "background 0.15s",
          flexShrink: 0,
          cursor: "pointer",
        }}
        onClick={() => {
          router.push("/tools/market");
        }}
      >
        <Link
          href="/tools/market"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flex: 1,
          }}
        >
          <TrendingUp style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>
            Market
          </span>
        </Link>
        <Link
          href="/tools/market"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
        </Link>
      </div>

      {/* TradingView Widget Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <MemoizedTradingViewWidget />
      </div>
    </div>
  );
}
