import { NextResponse } from "next/server";
import { getTrendingCompanies } from "@/lib/search-service";

export async function GET() {
  try {
    const trending = await getTrendingCompanies();
    return NextResponse.json(trending);
  } catch (error) {
    console.error("Error fetching trending companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending companies", google: [], x: [] },
      { status: 500 }
    );
  }
}
