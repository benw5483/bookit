import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmarks, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ImportCategory {
  name: string;
  color?: string;
  icon?: string | null;
  sortOrder?: number;
}

interface ImportBookmark {
  name: string;
  url: string;
  description?: string | null;
  favicon?: string | null;
  customImage?: string | null;
  categoryName?: string | null;
  keyboardShortcut?: string | null;
  sortOrder?: number;
}

interface ImportData {
  version?: number;
  categories?: ImportCategory[];
  bookmarks?: ImportBookmark[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data: ImportData = await req.json();

    if (!data.bookmarks && !data.categories) {
      return NextResponse.json(
        { error: "No bookmarks or categories to import" },
        { status: 400 }
      );
    }

    const results = {
      categoriesCreated: 0,
      categoriesSkipped: 0,
      bookmarksCreated: 0,
      bookmarksSkipped: 0,
    };

    // Map of category names to IDs (including existing ones)
    const categoryMap = new Map<string, number>();

    // Get existing categories
    const existingCategories = await db.query.categories.findMany();
    for (const cat of existingCategories) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    // Import categories
    if (data.categories) {
      for (const cat of data.categories) {
        const normalizedName = cat.name.toLowerCase();
        if (categoryMap.has(normalizedName)) {
          results.categoriesSkipped++;
          continue;
        }

        const [newCategory] = await db
          .insert(categories)
          .values({
            name: cat.name,
            color: cat.color || "#6366f1",
            icon: cat.icon || null,
            sortOrder: cat.sortOrder || 0,
            createdAt: new Date(),
          })
          .returning();

        categoryMap.set(normalizedName, newCategory.id);
        results.categoriesCreated++;
      }
    }

    // Get existing bookmark URLs to avoid duplicates
    const existingBookmarks = await db.query.bookmarks.findMany();
    const existingUrls = new Set(
      existingBookmarks.map((b) => b.url.toLowerCase())
    );

    // Import bookmarks
    if (data.bookmarks) {
      for (const bookmark of data.bookmarks) {
        if (existingUrls.has(bookmark.url.toLowerCase())) {
          results.bookmarksSkipped++;
          continue;
        }

        // Find category ID by name
        let categoryId: number | null = null;
        if (bookmark.categoryName) {
          categoryId =
            categoryMap.get(bookmark.categoryName.toLowerCase()) || null;
        }

        await db.insert(bookmarks).values({
          name: bookmark.name,
          url: bookmark.url,
          description: bookmark.description || null,
          favicon: bookmark.favicon || null,
          customImage: bookmark.customImage || null,
          categoryId,
          keyboardShortcut: bookmark.keyboardShortcut || null,
          sortOrder: bookmark.sortOrder || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        existingUrls.add(bookmark.url.toLowerCase());
        results.bookmarksCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("[Import API] Error:", error);
    return NextResponse.json(
      { error: "Failed to import bookmarks" },
      { status: 500 }
    );
  }
}
