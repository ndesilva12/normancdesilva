import { NextRequest, NextResponse } from "next/server";
import { getContact, listInteractions } from "@/lib/relationship-intel-db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; email: string }> }
) {
  try {
    const { projectId, email } = await context.params;
    const decodedEmail = decodeURIComponent(email);

    const [contact, interactions] = await Promise.all([
      getContact(projectId, decodedEmail),
      listInteractions(projectId, decodedEmail),
    ]);

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { contact, interactions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/relationship-intel/projects/[projectId]/contacts/[email]:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact details" },
      { status: 500 }
    );
  }
}
