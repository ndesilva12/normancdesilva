import { NextRequest, NextResponse } from "next/server";
import { createProject, getProject } from "@/lib/relationship-intel-db";

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

    console.log(`[create API] Creating project: ${name}`);

    const projectId = await createProject(
      name,
      keywords || [],
      tags || []
    );

    console.log(`[create API] Project ID: ${projectId}`);

    // Verify the project was created
    const verifyProject = await getProject(projectId);
    if (!verifyProject) {
      console.error(`[create API] Verification failed - project not found after creation: ${projectId}`);
      return NextResponse.json(
        { error: "Project created but verification failed" },
        { status: 500 }
      );
    }

    console.log(`[create API] Project verified: ${verifyProject.name}`);

    return NextResponse.json(
      { projectId, message: "Project created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/relationship-intel/projects/create:", error);
    return NextResponse.json(
      { error: "Failed to create project", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
