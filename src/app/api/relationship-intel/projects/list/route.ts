import { NextRequest, NextResponse } from "next/server";
import { listProjects } from "@/lib/relationship-intel-db";

export async function GET(request: NextRequest) {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/relationship-intel/projects/list:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
