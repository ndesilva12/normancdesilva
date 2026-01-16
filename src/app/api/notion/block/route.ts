import { NextRequest, NextResponse } from "next/server";
import { updateNotionBlock, deleteNotionBlock } from "@/lib/notion";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { blockId, content, blockType } = body;

    if (!blockId || content === undefined) {
      return NextResponse.json(
        { error: "Block ID and content are required" },
        { status: 400 }
      );
    }

    await updateNotionBlock(blockId, content, blockType);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notion block update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update block" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const blockId = searchParams.get("blockId");

    if (!blockId) {
      return NextResponse.json(
        { error: "Block ID is required" },
        { status: 400 }
      );
    }

    await deleteNotionBlock(blockId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notion block delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete block" },
      { status: 500 }
    );
  }
}
