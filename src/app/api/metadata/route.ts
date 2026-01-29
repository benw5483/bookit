import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    console.log("[Metadata API] Fetching:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Bookit/1.0)",
      },
    });

    if (!response.ok) {
      console.log("[Metadata API] Fetch failed:", response.status);
      return NextResponse.json({ title: null });
    }

    const html = await response.text();

    // Try to extract title from <title> tag
    let title: string | null = null;

    // Match <title>...</title>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // If no title tag, try og:title
    if (!title) {
      const ogTitleMatch = html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim();
      }
    }

    // Also try the reverse attribute order for og:title
    if (!title) {
      const ogTitleMatch2 = html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i
      );
      if (ogTitleMatch2) {
        title = ogTitleMatch2[1].trim();
      }
    }

    // Clean up the title
    if (title) {
      // Decode HTML entities
      title = title
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");

      // Remove common suffixes like " - Company Name" or " | Site Name"
      // Only if the title is long enough
      if (title.length > 30) {
        const separators = [" - ", " | ", " · ", " — ", " : "];
        for (const sep of separators) {
          const lastIndex = title.lastIndexOf(sep);
          if (lastIndex > 10) {
            // Keep at least 10 chars
            title = title.substring(0, lastIndex).trim();
            break;
          }
        }
      }
    }

    console.log("[Metadata API] Found title:", title);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("[Metadata API] Error:", error);
    return NextResponse.json({ title: null });
  }
}
