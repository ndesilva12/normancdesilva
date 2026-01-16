import { NextRequest, NextResponse } from "next/server";

interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
}

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ error: "Missing symbols parameter" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase()).slice(0, 10);

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
    }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching stock data:", error);

    // Fallback: return mock data if Yahoo fails
    const mockQuotes: StockQuote[] = symbols.map((symbol) => {
      // Generate realistic mock data
      const basePrice = getBasePriceForSymbol(symbol);
      const change = (Math.random() - 0.5) * basePrice * 0.05;
      const changePercent = (change / basePrice) * 100;

      return {
        symbol,
        name: getNameForSymbol(symbol),
        price: basePrice + change,
        change,
        changePercent,
        currency: symbol.includes("-USD") ? "USD" : "USD",
      };
    });

    return NextResponse.json({ quotes: mockQuotes, isMock: true });
  }
}

function getBasePriceForSymbol(symbol: string): number {
  const prices: Record<string, number> = {
    SPY: 580,
    QQQ: 500,
    AAPL: 185,
    TSLA: 250,
    NVDA: 140,
    MSFT: 425,
    GOOGL: 175,
    AMZN: 200,
    META: 550,
    "BTC-USD": 105000,
    "ETH-USD": 3900,
    DIA: 420,
    IWM: 220,
  };
  return prices[symbol] || 100 + Math.random() * 200;
}

function getNameForSymbol(symbol: string): string {
  const names: Record<string, string> = {
    SPY: "SPDR S&P 500 ETF",
    QQQ: "Invesco QQQ Trust",
    AAPL: "Apple Inc.",
    TSLA: "Tesla Inc.",
    NVDA: "NVIDIA Corporation",
    MSFT: "Microsoft Corporation",
    GOOGL: "Alphabet Inc.",
    AMZN: "Amazon.com Inc.",
    META: "Meta Platforms Inc.",
    "BTC-USD": "Bitcoin USD",
    "ETH-USD": "Ethereum USD",
    DIA: "SPDR Dow Jones ETF",
    IWM: "iShares Russell 2000",
  };
  return names[symbol] || symbol;
}
