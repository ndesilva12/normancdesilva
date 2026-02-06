import { NextRequest, NextResponse } from "next/server";
import { listContacts } from "@/lib/relationship-intel-db";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",") : undefined;
    const sortBy = (searchParams.get("sortBy") as "name" | "lastContact" | "interactionCount") || "lastContact";

    const contacts = await listContacts(projectId, search, tags, sortBy);

    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/relationship-intel/projects/[projectId]/contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
