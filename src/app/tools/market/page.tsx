"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, RefreshCw, Settings, X, Plus, ExternalLink, Newspaper } from "lucide-react";
import { Header } from "@/components/Header";

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketCap?: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

const DEFAULT_SYMBOLS = [
  "^GSPC", "SPY", "TLT", "QQQ", "IWM", "^VIX", "GC=F", "SI=F",
  "BTC-USD", "TSLA", "GLD", "SLV", "CL=F", "XLE", "GME", "CVNA",
  "KSS", "RKT", "HTZ", "GRPN", "BETR", "OPEN", "BSX",
];

export default function MarketPage() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [newSymbol, setNewSymbol] = useState("");
  const settingsRef = useRef<HTMLDivElement>(null);

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
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

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
    if (symbol && !symbols.includes(symbol) && symbols.length < 50) {
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

  const formatLargeNumber = (num: number | undefined) => {
    if (!num) return "N/A";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatVolume = (num: number | undefined) => {
    if (!num) return "N/A";
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const getNewsUrl = (symbol: string) => {
    // Clean symbol for news search
    const cleanSymbol = symbol.replace("^", "").replace("=F", "").replace("-USD", "");
    return `https://www.google.com/search?q=${encodeURIComponent(cleanSymbol + " stock news")}&tbm=nws`;
  };

  const getTradingViewUrl = (symbol: string) => {
    // Map Yahoo symbols to TradingView symbols
    const mappings: Record<string, string> = {
      "^GSPC": "SP:SPX",
      "^VIX": "TVC:VIX",
      "^TNX": "TVC:US10Y",
      "^TYX": "TVC:US30Y",
      "GC=F": "TVC:GOLD",
      "SI=F": "TVC:SILVER",
      "CL=F": "TVC:USOIL",
      "BTC-USD": "BITSTAMP:BTCUSD",
      "ETH-USD": "BITSTAMP:ETHUSD",
      "DX-Y.NYB": "TVC:DXY",
      "JPY=X": "FX:USDJPY",
    };
    const tvSymbol = mappings[symbol] || `NASDAQ:${symbol}`;
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%" }}>
        <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto", padding: "24px 24px 100px 24px" }}>
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
                Track stocks, indices, commodities, and crypto
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", position: "relative" }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  backgroundColor: showSettings ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: showSettings ? "var(--background)" : "var(--foreground-muted)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <Settings style={{ width: "16px", height: "16px" }} />
                Manage
              </button>
              <button
                onClick={fetchQuotes}
                disabled={loading}
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
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <RefreshCw style={{ width: "16px", height: "16px", animation: loading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>

              {/* Settings Panel */}
              {showSettings && (
                <div
                  ref={settingsRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    backgroundColor: "#1c1c1c",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "12px",
                    padding: "16px",
                    zIndex: 100,
                    width: "320px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                      Add Symbol
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSymbol()}
                        placeholder="e.g., NVDA, AAPL"
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--glass-border)",
                          backgroundColor: "transparent",
                          color: "var(--foreground)",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={handleAddSymbol}
                        disabled={!newSymbol.trim() || symbols.length >= 50}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          backgroundColor: "var(--accent)",
                          color: "var(--background)",
                          border: "none",
                          fontSize: "14px",
                          fontWeight: 500,
                          cursor: "pointer",
                          opacity: !newSymbol.trim() || symbols.length >= 50 ? 0.5 : 1,
                        }}
                      >
                        <Plus style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                    Your Watchlist ({symbols.length}/50)
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {symbols.map((symbol) => (
                      <div
                        key={symbol}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "6px",
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
                            width: "16px",
                            height: "16px",
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
            </div>
          </div>

          {/* Quotes Grid */}
          {loading && quotes.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div className="glass" style={{ borderRadius: "12px", padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "16px" }}>{error}</p>
              <button
                onClick={fetchQuotes}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {quotes.map((quote) => (
                <div
                  key={quote.symbol}
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Main Quote Info */}
                  <a
                    href={getTradingViewUrl(quote.symbol)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      textDecoration: "none",
                      borderBottom: "1px solid var(--glass-border)",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        backgroundColor: quote.change >= 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {quote.change >= 0 ? (
                        <TrendingUp style={{ width: "22px", height: "22px", color: "#22c55e" }} />
                      ) : (
                        <TrendingDown style={{ width: "22px", height: "22px", color: "#ef4444" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                        {quote.symbol}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--foreground-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {quote.name}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>
                        {formatPrice(quote.price, quote.currency)}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: quote.change >= 0 ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {formatChange(quote.change, quote.changePercent)}
                      </div>
                    </div>
                  </a>

                  {/* Additional Data */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "1px",
                      backgroundColor: "var(--glass-border)",
                    }}
                  >
                    <div style={{ padding: "10px 12px", backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                      <div style={{ fontSize: "10px", color: "var(--foreground-muted)", marginBottom: "2px" }}>
                        Volume
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)" }}>
                        {formatVolume(quote.volume)}
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px", backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                      <div style={{ fontSize: "10px", color: "var(--foreground-muted)", marginBottom: "2px" }}>
                        Day Range
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)" }}>
                        {quote.dayLow && quote.dayHigh
                          ? `${quote.dayLow.toFixed(2)} - ${quote.dayHigh.toFixed(2)}`
                          : "N/A"}
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px", backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                      <div style={{ fontSize: "10px", color: "var(--foreground-muted)", marginBottom: "2px" }}>
                        Mkt Cap
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)" }}>
                        {formatLargeNumber(quote.marketCap)}
                      </div>
                    </div>
                  </div>

                  {/* Action Links */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderTop: "1px solid var(--glass-border)",
                    }}
                  >
                    <a
                      href={getTradingViewUrl(quote.symbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(6, 182, 212, 0.15)",
                        color: "var(--accent)",
                        fontSize: "11px",
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink style={{ width: "12px", height: "12px" }} />
                      Chart
                    </a>
                    <a
                      href={getNewsUrl(quote.symbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        color: "var(--foreground-muted)",
                        fontSize: "11px",
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      <Newspaper style={{ width: "12px", height: "12px" }} />
                      News
                    </a>
                    <a
                      href={`https://finance.yahoo.com/quote/${quote.symbol}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        color: "var(--foreground-muted)",
                        fontSize: "11px",
                        fontWeight: 500,
                        textDecoration: "none",
                        marginLeft: "auto",
                      }}
                    >
                      Yahoo Finance
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
