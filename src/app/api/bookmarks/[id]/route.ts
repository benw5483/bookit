import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const bookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, parseInt(id)),
      with: {
        category: true,
      },
    });

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error("Failed to fetch bookmark:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmark" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const bookmarkId = parseInt(id);
    const body = await req.json();
    const { name, url, description, favicon, customImage, categoryId, keyboardShortcut, sortOrder } =
      body;

    // Check for duplicate URL if URL is being updated (case-insensitive, exclude current bookmark)
    if (url !== undefined) {
      const existingBookmark = await db.query.bookmarks.findFirst({
        where: and(
          sql`LOWER(${bookmarks.url}) = LOWER(${url})`,
          ne(bookmarks.id, bookmarkId)
        ),
      });

      if (existingBookmark) {
        return NextResponse.json(
          { error: "A bookmark with this URL already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate keyboard shortcut if being updated (exclude current bookmark)
    if (keyboardShortcut) {
      const existingShortcut = await db.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.keyboardShortcut, keyboardShortcut),
          ne(bookmarks.id, bookmarkId)
        ),
      });

      if (existingShortcut) {
        return NextResponse.json(
          { error: `Keyboard shortcut "${keyboardShortcut}" is already in use` },
          { status: 409 }
        );
      }
    }

    const updated = await db
      .update(bookmarks)
      .set({
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(description !== undefined && { description }),
        ...(favicon !== undefined && { favicon }),
        ...(customImage !== undefined && { customImage }),
        ...(categoryId !== undefined && { categoryId }),
        ...(keyboardShortcut !== undefined && { keyboardShortcut }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date(),
      })
      .where(eq(bookmarks.id, bookmarkId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update bookmark:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, parseInt(id)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
