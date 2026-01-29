import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookmarks = await db.query.bookmarks.findMany({
      with: { category: true },
      orderBy: (bookmarks, { asc }) => [asc(bookmarks.sortOrder)],
    });

    const categories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
    });

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: categories.map((c) => ({
        name: c.name,
        color: c.color,
        icon: c.icon,
        sortOrder: c.sortOrder,
      })),
      bookmarks: bookmarks.map((b) => ({
        name: b.name,
        url: b.url,
        description: b.description,
        favicon: b.favicon,
        customImage: b.customImage,
        categoryName: b.category?.name || null,
        keyboardShortcut: b.keyboardShortcut,
        sortOrder: b.sortOrder,
        createdAt: b.createdAt.toISOString(),
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="bookit-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("[Export API] Error:", error);
    return NextResponse.json(
      { error: "Failed to export bookmarks" },
      { status: 500 }
    );
  }
}
