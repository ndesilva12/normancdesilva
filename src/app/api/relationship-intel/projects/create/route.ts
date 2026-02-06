import { NextRequest, NextResponse } from "next/server";
import { createProject } from "@/lib/relationship-intel-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, keywords, tags } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const projectId = await createProject(
      name,
      keywords || [],
      tags || []
    );

    return NextResponse.json(
      { projectId, message: "Project created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/relationship-intel/projects/create:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
