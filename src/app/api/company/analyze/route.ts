import { NextRequest, NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/ai-service";
import { getCachedReport, cacheReport } from "@/lib/company-cache";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyName = searchParams.get("company");

  if (!companyName) {
    return NextResponse.json(
      { error: "Company name is required" },
      { status: 400 }
    );
  }

  // Check if API keys are configured
  const hasGrokKey = !!process.env.GROK_API_KEY;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

  if (!hasGrokKey && !hasAnthropicKey) {
    return NextResponse.json(
      {
        error: "AI API not configured",
        details: "No AI API key (GROK_API_KEY or ANTHROPIC_API_KEY) is configured in environment variables"
      },
      { status: 503 }
    );
  }

  try {
    // Check cache first
    const cachedReport = await getCachedReport(companyName);
    if (cachedReport) {
      return NextResponse.json({
        success: true,
        data: cachedReport,
        cached: true,
      });
    }

    // No cache hit, call AI
    const analysis = await analyzeCompany(companyName);

    // Cache the result
    await cacheReport(analysis);

    return NextResponse.json({
      success: true,
      data: analysis,
      cached: false,
    });
  } catch (error) {
    console.error("Error analyzing company:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide helpful error messages
    if (errorMessage.includes("401") || errorMessage.includes("403")) {
      return NextResponse.json(
        { error: "API authentication failed", details: "Check that your API key is valid" },
        { status: 401 }
      );
    }

    if (errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Too many requests, please try again later" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze company", details: errorMessage },
      { status: 500 }
    );
  }
}
