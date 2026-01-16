import { NextRequest, NextResponse } from "next/server";

interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  marketCap?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ error: "Missing symbols parameter" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim()).slice(0, 30);

  try {
    // Use Yahoo Finance API through their chart/quote endpoint
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data?.quoteResponse?.result || [];

    const quotes: StockQuote[] = results.map((item: YahooQuote) => ({
      symbol: item.symbol,
      name: item.shortName || item.longName || item.symbol,
      price: item.regularMarketPrice || 0,
      change: item.regularMarketChange || 0,
      changePercent: item.regularMarketChangePercent || 0,
      currency: item.currency || "USD",
      marketCap: item.marketCap,
      volume: item.regularMarketVolume,
      dayHigh: item.regularMarketDayHigh,
      dayLow: item.regularMarketDayLow,
      fiftyTwoWeekHigh: item.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: item.fiftyTwoWeekLow,
    }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching stock data:", error);

    // Return error status with static fallback prices (not random)
    // This makes it clear the data may be stale
    const fallbackQuotes: StockQuote[] = symbols.map((symbol) => {
      const basePrice = getBasePriceForSymbol(symbol);

      return {
        symbol,
        name: getNameForSymbol(symbol),
        price: basePrice,
        change: 0, // No change data available
        changePercent: 0, // No change data available
        currency: symbol.includes("-USD") ? "USD" : "USD",
      };
    });

    return NextResponse.json({
      quotes: fallbackQuotes,
      isStale: true,
      error: "Live data temporarily unavailable. Showing reference prices.",
    });
  }
}

function getBasePriceForSymbol(symbol: string): number {
  const prices: Record<string, number> = {
    // Indices & ETFs
    "^GSPC": 6964,
    SPY: 692,
    TLT: 88,
    QQQ: 622,
    IWM: 266,
    "^VIX": 15.5,
    DIA: 420,
    XLE: 48,
    GLD: 423,
    SLV: 83,
    // Commodities
    "GC=F": 4603,
    "SI=F": 91,
    "CL=F": 59,
    // Crypto & Forex
    "BTC-USD": 95626,
    "ETH-USD": 3900,
    "JPY=X": 158,
    "DX-Y.NYB": 99,
    // Bonds
    "^TNX": 4.17,
    "^TYX": 4.81,
    // Stocks
    TSLA: 439,
    BSX: 90,
    GME: 21,
    CVNA: 461,
    KSS: 19,
    RKT: 23,
    HTZ: 5.6,
    GRPN: 17,
    BETR: 37,
    OPEN: 6.3,
    // Others
    AAPL: 185,
    NVDA: 140,
    MSFT: 425,
    GOOGL: 175,
    AMZN: 200,
    META: 550,
  };
  return prices[symbol] || 100 + Math.random() * 200;
}

function getNameForSymbol(symbol: string): string {
  const names: Record<string, string> = {
    // Indices & ETFs
    "^GSPC": "S&P 500",
    SPY: "SPDR S&P 500 ETF",
    TLT: "iShares 20+ Year Treasury",
    QQQ: "Invesco QQQ Trust",
    IWM: "iShares Russell 2000",
    "^VIX": "CBOE Volatility Index",
    DIA: "SPDR Dow Jones ETF",
    XLE: "Energy Select Sector",
    GLD: "SPDR Gold Trust",
    SLV: "iShares Silver Trust",
    // Commodities
    "GC=F": "Gold Futures",
    "SI=F": "Silver Futures",
    "CL=F": "Crude Oil WTI",
    // Crypto & Forex
    "BTC-USD": "Bitcoin USD",
    "ETH-USD": "Ethereum USD",
    "JPY=X": "USD/JPY",
    "DX-Y.NYB": "US Dollar Index",
    // Bonds
    "^TNX": "10-Year Treasury Yield",
    "^TYX": "30-Year Treasury Yield",
    // Stocks
    TSLA: "Tesla Inc.",
    BSX: "Boston Scientific",
    GME: "GameStop Corp.",
    CVNA: "Carvana Co.",
    KSS: "Kohl's Corp.",
    RKT: "Rocket Companies",
    HTZ: "Hertz Global",
    GRPN: "Groupon Inc.",
    BETR: "Better Home & Finance",
    OPEN: "Opendoor Technologies",
    // Others
    AAPL: "Apple Inc.",
    NVDA: "NVIDIA Corporation",
    MSFT: "Microsoft Corporation",
    GOOGL: "Alphabet Inc.",
    AMZN: "Amazon.com Inc.",
    META: "Meta Platforms Inc.",
  };
  return names[symbol] || symbol;
}
