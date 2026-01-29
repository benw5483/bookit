import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bookmarkId = parseInt(id);

  if (isNaN(bookmarkId)) {
    return NextResponse.json({ error: "Invalid bookmark ID" }, { status: 400 });
  }

  try {
    // Get current bookmark
    const bookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, bookmarkId),
    });

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Toggle starred status
    const [updated] = await db
      .update(bookmarks)
      .set({
        starred: !bookmark.starred,
        updatedAt: new Date(),
      })
      .where(eq(bookmarks.id, bookmarkId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Star API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
