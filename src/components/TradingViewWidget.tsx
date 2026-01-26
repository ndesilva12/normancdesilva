"use client";

import { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  height?: number | string;
  width?: number | string;
  colorTheme?: "light" | "dark";
  symbols?: string[][];
}

// Default symbols from user's TradingView watchlist
// Note: Removed VIX, DXY, US10Y, US30Y as they don't display in Market Overview widget
const DEFAULT_SYMBOLS = [
  ["CAPITALCOM:US500|1D"],
  ["AMEX:SPY|1D"],
  ["NASDAQ:QQQ|1D"],
  ["AMEX:IWM|1D"],
  ["NYSE:BSX|1D"],
  ["TVC:GOLD|1D"],
  ["TVC:SILVER|1D"],
  ["NASDAQ:TLT|1D"],
  ["COINBASE:BTCUSD|1D"],
  ["FX:USDJPY|1D"],
  ["NASDAQ:TSLA|1D"],
  ["AMEX:GLD|1D"],
  ["AMEX:SLV|1D"],
  ["NYMEX:CL1!|1D"],
  ["AMEX:XLE|1D"],
  ["NYSE:GME|1D"],
  ["NYSE:CVNA|1D"],
  ["NYSE:KSS|1D"],
  ["NYSE:RKT|1D"],
  ["NASDAQ:HTZ|1D"],
  ["NASDAQ:GRPN|1D"],
  ["NASDAQ:BETR|1D"],
  ["NASDAQ:OPEN|1D"],
];

function TradingViewWidgetComponent({
  height = 400,
  width = "100%",
  colorTheme = "dark",
  symbols = DEFAULT_SYMBOLS,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

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
      colorTheme,
      dateRange: "1D",
      showChart: false,
      locale: "en",
      width,
      height,
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(41, 98, 255, 1)",
      plotLineColorFalling: "rgba(255, 68, 68, 1)",
      gridLineColor: "rgba(240, 243, 250, 0)",
      scaleFontColor: "rgba(209, 212, 220, 1)",
      belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorFalling: "rgba(255, 68, 68, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(255, 68, 68, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      tabs: [
        {
          title: "Watchlist",
          symbols: symbols.map((s) => ({ s: s[0] })),
        },
      ],
    });

    containerRef.current.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [colorTheme, height, width, symbols]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

export const TradingViewWidget = memo(TradingViewWidgetComponent);
