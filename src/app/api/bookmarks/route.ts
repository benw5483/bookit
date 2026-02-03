import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allBookmarks = await db.query.bookmarks.findMany({
      orderBy: [asc(bookmarks.sortOrder), desc(bookmarks.createdAt)],
      with: {
        category: true,
      },
    });

    return NextResponse.json(allBookmarks);
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, url, description, favicon, customImage, categoryId, keyboardShortcut } =
      body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    // Check for duplicate URL (case-insensitive)
    const existingBookmark = await db.query.bookmarks.findFirst({
      where: sql`LOWER(${bookmarks.url}) = LOWER(${url})`,
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: "A bookmark with this URL already exists" },
        { status: 409 }
      );
    }

    // Check for duplicate keyboard shortcut
    if (keyboardShortcut) {
      const existingShortcut = await db.query.bookmarks.findFirst({
        where: eq(bookmarks.keyboardShortcut, keyboardShortcut),
      });

      if (existingShortcut) {
        return NextResponse.json(
          { error: `Keyboard shortcut "${keyboardShortcut}" is already in use` },
          { status: 409 }
        );
      }
    }

    // Get the max sort order
    const maxOrder = await db.query.bookmarks.findFirst({
      orderBy: [desc(bookmarks.sortOrder)],
    });

    const newBookmark = await db
      .insert(bookmarks)
      .values({
        name,
        url,
        description: description || null,
        favicon: favicon || null,
        customImage: customImage || null,
        categoryId: categoryId || null,
        keyboardShortcut: keyboardShortcut || null,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      })
      .returning();

    return NextResponse.json(newBookmark[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
