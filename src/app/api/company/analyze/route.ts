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
    return NextResponse.json(
      { error: "Failed to analyze company", details: String(error) },
      { status: 500 }
    );
  }
}
