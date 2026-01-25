"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Loader2, ExternalLink, Settings, X, ChevronUp } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

interface StocksPreviewProps {
  defaultSymbols?: string[];
}

// User's watchlist - mapped to Yahoo Finance symbols
const DEFAULT_SYMBOLS = [
  "^GSPC",    // US500 (S&P 500)
  "SPY",      // SPY
  "TLT",      // TLT
  "QQQ",      // QQQ
  "IWM",      // IWM
  "^VIX",     // VIX
  "GC=F",     // GOLD (futures)
  "BTC-USD",  // BTCUSD
  "TSLA",     // TSLA
  "GLD",      // GLD
];

export function StocksPreview({ defaultSymbols = DEFAULT_SYMBOLS }: StocksPreviewProps) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [symbols, setSymbols] = useState<string[]>(defaultSymbols);
  const [newSymbol, setNewSymbol] = useState("");
  const settingsRef = useRef<HTMLDivElement>(null);
  const { getWidgetConfig, toggleWidgetCollapse, isEditMode } = useLayout();
  const router = useRouter();

  const config = getWidgetConfig("previewWidgets", "stocks");
  const isCollapsed = config?.size === "collapsed";

  // Load saved symbols from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("stock-symbols");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSymbols(parsed);
        }
      } catch {
        // Use defaults
      }
    }
  }, []);

  // Save symbols to localStorage
  useEffect(() => {
    localStorage.setItem("stock-symbols", JSON.stringify(symbols));
  }, [symbols]);

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stocks?symbols=${symbols.join(",")}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }
      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stocks");
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchQuotes();
    // Refresh every 60 seconds
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  const handleAddSymbol = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !symbols.includes(symbol) && symbols.length < 30) {
      setSymbols([...symbols, symbol]);
      setNewSymbol("");
    }
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter((s) => s !== symbolToRemove));
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "USD") {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - clickable to navigate to market page */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: isCollapsed ? "none" : "1px solid var(--glass-border)",
          transition: "background 0.15s",
          flexShrink: 0,
          cursor: isCollapsed ? "default" : "pointer",
        }}
        onClick={() => {
          if (!isCollapsed) {
            router.push("/tools/market");
          }
        }}
      >
        <Link
          href="/tools/market"
          onClick={(e) => {
            e.stopPropagation();
            if (isCollapsed) {
              e.preventDefault();
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flex: 1,
            pointerEvents: isCollapsed ? "none" : "auto",
          }}
        >
          <TrendingUp style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>
            Market
          </span>
        </Link>
        {!isCollapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: showSettings ? "var(--accent)" : "transparent",
              border: "none",
              color: showSettings ? "var(--background)" : "var(--foreground-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Settings style={{ width: "14px", height: "14px" }} />
          </button>
        )}
        {/* Collapse button (only shown when not collapsed and not in edit mode) */}
        {!isCollapsed && !isEditMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWidgetCollapse("previewWidgets", "stocks");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--foreground-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            title="Collapse"
          >
            <ChevronUp style={{ width: "16px", height: "16px" }} />
          </button>
        )}
        {!isCollapsed && (
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
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          ref={settingsRef}
          style={{
            position: "absolute",
            top: "60px",
            right: "12px",
            backgroundColor: "#1c1c1c",
            border: "1px solid var(--glass-border)",
            borderRadius: "10px",
            padding: "12px",
            zIndex: 100,
            minWidth: "220px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              Add Symbol
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleAddSymbol()}
                placeholder="e.g., NVDA"
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleAddSymbol}
                disabled={!newSymbol.trim() || symbols.length >= 30}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: !newSymbol.trim() || symbols.length >= 30 ? 0.5 : 1,
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Your Symbols ({symbols.length}/30)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {symbols.map((symbol) => (
              <div
                key={symbol}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
              >
                {symbol}
                <button
                  onClick={() => handleRemoveSymbol(symbol)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "var(--foreground-muted)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X style={{ width: "10px", height: "10px" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "8px 12px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {loading && quotes.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
            <button
              onClick={fetchQuotes}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : quotes.length === 0 ? (
          <div style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            No stocks configured. Click settings to add symbols.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {quotes.map((quote) => (
              <a
                key={quote.symbol}
                href={`https://finance.yahoo.com/quote/${quote.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 6px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    backgroundColor: quote.change >= 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {quote.change >= 0 ? (
                    <TrendingUp style={{ width: "12px", height: "12px", color: "#22c55e" }} />
                  ) : (
                    <TrendingDown style={{ width: "12px", height: "12px", color: "#ef4444" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
                      {quote.symbol}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--foreground-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {quote.name}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
                    {formatPrice(quote.price, quote.currency)}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: quote.change >= 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {formatChange(quote.change, quote.changePercent)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
