import { NextRequest, NextResponse } from "next/server";
import { getRecentRosters } from "@/lib/roster-cache";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const recentRosters = await getRecentRosters(Math.min(limit, 20));

    return NextResponse.json({
      success: true,
      rosters: recentRosters,
    });
  } catch (error) {
    console.error("Error fetching recent rosters:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent rosters" },
      { status: 500 }
    );
  }
}
