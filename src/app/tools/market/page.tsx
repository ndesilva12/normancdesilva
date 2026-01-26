"use client";

import { useEffect, useRef, memo } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { SwipeNavigation } from "@/components/SwipeNavigation";

// User's TradingView watchlist symbols
const WATCHLIST_SYMBOLS = [
  { s: "CAPITALCOM:US500", d: "US 500" },
  { s: "AMEX:SPY", d: "SPDR S&P 500 ETF" },
  { s: "NASDAQ:QQQ", d: "Invesco QQQ Trust" },
  { s: "AMEX:IWM", d: "iShares Russell 2000" },
  { s: "NYSE:BSX", d: "Boston Scientific" },
  { s: "TVC:GOLD", d: "Gold" },
  { s: "TVC:SILVER", d: "Silver" },
  { s: "NASDAQ:TLT", d: "20+ Year Treasury Bond" },
  { s: "COINBASE:BTCUSD", d: "Bitcoin USD" },
  { s: "TVC:VIX", d: "VIX Volatility Index" },
  { s: "TVC:DXY", d: "US Dollar Index" },
  { s: "TVC:US10Y", d: "10-Year Treasury Yield" },
  { s: "TVC:US30Y", d: "30-Year Treasury Yield" },
  { s: "FX:USDJPY", d: "USD/JPY" },
  { s: "NASDAQ:TSLA", d: "Tesla" },
  { s: "AMEX:GLD", d: "SPDR Gold Shares" },
  { s: "AMEX:SLV", d: "iShares Silver Trust" },
  { s: "BLACKBULL:WTI", d: "Crude Oil WTI" },
  { s: "AMEX:XLE", d: "Energy Select Sector" },
  { s: "NYSE:GME", d: "GameStop" },
  { s: "NYSE:CVNA", d: "Carvana" },
  { s: "FRED:MORTGAGE30US", d: "30-Year Mortgage Rate" },
  { s: "NYSE:KSS", d: "Kohl's" },
  { s: "NYSE:RKT", d: "Rocket Companies" },
  { s: "NASDAQ:HTZ", d: "Hertz" },
  { s: "NASDAQ:GRPN", d: "Groupon" },
  { s: "NASDAQ:BETR", d: "Better Home & Finance" },
  { s: "NASDAQ:OPEN", d: "Opendoor Technologies" },
];

function TradingViewMarketWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = "";

    // Create the widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    // Create and append the script for Market Overview widget
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(34, 197, 94, 1)",
      plotLineColorFalling: "rgba(239, 68, 68, 1)",
      gridLineColor: "rgba(240, 243, 250, 0.1)",
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
        height: "700px",
        minHeight: "500px",
      }}
    />
  );
}

const MemoizedMarketWidget = memo(TradingViewMarketWidget);

export default function MarketPage() {
  return (
    <SwipeNavigation backPath="/">
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
        <Header />

        <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
          <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 100px 24px" }}>
            <RemindersBanner />
            {/* Back Link */}
            <div style={{ marginBottom: "24px" }}>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  color: "var(--foreground-muted)",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                <ArrowLeft style={{ width: "16px", height: "16px" }} />
                Back to Dashboard
              </Link>
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <TrendingUp style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
                  Market
                </h1>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Real-time market data powered by TradingView
                </p>
              </div>
              <a
                href="https://www.tradingview.com/watchlists/16742067/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground-muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                <svg viewBox="0 0 36 28" width="18" height="14" fill="currentColor">
                  <path d="M14 22H7V6h7v16ZM21 22h-7V0h7v22Zm14 6H21V11h14v17Z" />
                </svg>
                Open in TradingView
              </a>
            </div>

            {/* TradingView Widget */}
            <div
              className="glass"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                padding: "0",
              }}
            >
              <MemoizedMarketWidget />
            </div>

            {/* Attribution */}
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <a
                href="https://www.tradingview.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "12px",
                  color: "var(--foreground-muted)",
                  textDecoration: "none",
                }}
              >
                Market data by TradingView
              </a>
            </div>
          </div>
        </main>
      </div>
    </SwipeNavigation>
  );
}
