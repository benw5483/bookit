import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderedIds, categoryId } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // Update sort order for each bookmark
    // categoryId === null means we're reordering in the "All" view (global sortOrder)
    // categoryId !== null means we're reordering within a category (categorySortOrder)
    const isGlobalReorder = categoryId === null;

    await Promise.all(
      orderedIds.map((id: number, index: number) => {
        if (isGlobalReorder) {
          return db
            .update(bookmarks)
            .set({ sortOrder: index })
            .where(eq(bookmarks.id, id));
        } else {
          return db
            .update(bookmarks)
            .set({ categorySortOrder: index })
            .where(eq(bookmarks.id, id));
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reorder API] Error:", error);
    return NextResponse.json(
      { error: "Failed to reorder bookmarks" },
      { status: 500 }
    );
  }
}
