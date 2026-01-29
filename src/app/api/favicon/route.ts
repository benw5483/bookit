import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const FAVICON_DIR = path.join(process.cwd(), "public", "uploads", "favicons");

// Get parent domains to try (e.g., "sub.example.com" -> ["sub.example.com", "example.com"])
function getDomainVariants(domain: string): string[] {
  const parts = domain.split(".");
  const variants: string[] = [domain];

  // Add parent domains (but keep at least 2 parts for a valid domain)
  while (parts.length > 2) {
    parts.shift();
    variants.push(parts.join("."));
  }

  return variants;
}

async function tryFetchFavicon(
  domain: string
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  // Try Google's favicon service
  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  console.log(`[Favicon API] Trying Google for ${domain}`);

  try {
    const response = await fetch(googleFaviconUrl);
    if (response.ok) {
      const data = await response.arrayBuffer();
      // Google returns a default globe icon (very small) when no favicon found
      // Real favicons are typically > 500 bytes
      if (data.byteLength > 500) {
        console.log(`[Favicon API] Google success for ${domain}: ${data.byteLength} bytes`);
        return {
          data,
          contentType: response.headers.get("content-type") || "image/png",
        };
      }
      console.log(`[Favicon API] Google returned default icon for ${domain}: ${data.byteLength} bytes`);
    }
  } catch (e) {
    console.error(`[Favicon API] Google fetch failed for ${domain}:`, e);
  }

  // Try direct favicon.ico
  console.log(`[Favicon API] Trying direct fetch for ${domain}`);
  try {
    const directUrl = `https://${domain}/favicon.ico`;
    const response = await fetch(directUrl);
    if (response.ok) {
      const data = await response.arrayBuffer();
      if (data.byteLength > 0) {
        console.log(`[Favicon API] Direct success for ${domain}: ${data.byteLength} bytes`);
        return {
          data,
          contentType: response.headers.get("content-type") || "image/x-icon",
        };
      }
    }
  } catch (e) {
    console.error(`[Favicon API] Direct fetch failed for ${domain}:`, e);
  }

  // Try apple-touch-icon
  console.log(`[Favicon API] Trying apple-touch-icon for ${domain}`);
  try {
    const appleIconUrl = `https://${domain}/apple-touch-icon.png`;
    const response = await fetch(appleIconUrl);
    if (response.ok) {
      const data = await response.arrayBuffer();
      if (data.byteLength > 0) {
        console.log(`[Favicon API] Apple icon success for ${domain}: ${data.byteLength} bytes`);
        return {
          data,
          contentType: "image/png",
        };
      }
    }
  } catch (e) {
    console.error(`[Favicon API] Apple icon fetch failed for ${domain}:`, e);
  }

  return null;
}

export async function GET(req: NextRequest) {
  console.log("[Favicon API] Request received");

  const session = await auth();
  console.log("[Favicon API] Session:", session ? "authenticated" : "not authenticated");

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  console.log("[Favicon API] URL param:", url);

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const urlObj = new URL(url);
    const originalDomain = urlObj.hostname;
    console.log("[Favicon API] Original domain:", originalDomain);

    // Use original domain for hash (so cache is per-subdomain)
    const hash = crypto.createHash("md5").update(originalDomain).digest("hex");
    console.log("[Favicon API] Hash:", hash);

    // Ensure favicon directory exists
    if (!existsSync(FAVICON_DIR)) {
      console.log("[Favicon API] Creating favicon directory");
      await mkdir(FAVICON_DIR, { recursive: true });
    }

    // Check if we already have this favicon cached
    try {
      const files = await readdir(FAVICON_DIR);
      const existingFile = files.find((f) => f.startsWith(hash));
      if (existingFile) {
        console.log("[Favicon API] Found cached favicon:", existingFile);
        return NextResponse.json({ favicon: `/api/uploads/favicons/${existingFile}` });
      }
    } catch {
      // Directory might not exist yet
    }

    // Get domain variants to try
    const domains = getDomainVariants(originalDomain);
    console.log("[Favicon API] Will try domains:", domains);

    let faviconResult: { data: ArrayBuffer; contentType: string } | null = null;

    // Try each domain variant
    for (const domain of domains) {
      faviconResult = await tryFetchFavicon(domain);
      if (faviconResult) {
        console.log(`[Favicon API] Found favicon from domain: ${domain}`);
        break;
      }
    }

    if (!faviconResult) {
      console.log("[Favicon API] No favicon found for any domain variant");
      return NextResponse.json({ favicon: null });
    }

    // Determine file extension
    let ext = ".png";
    const contentType = faviconResult.contentType;
    if (contentType.includes("ico")) ext = ".ico";
    else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = ".jpg";
    else if (contentType.includes("gif")) ext = ".gif";
    else if (contentType.includes("webp")) ext = ".webp";

    const filename = `${hash}${ext}`;
    const filePath = path.join(FAVICON_DIR, filename);
    const publicUrl = `/api/uploads/favicons/${filename}`;

    console.log("[Favicon API] Saving to:", filePath);

    try {
      // Ensure directory exists before writing
      if (!existsSync(FAVICON_DIR)) {
        console.log("[Favicon API] Creating directory:", FAVICON_DIR);
        await mkdir(FAVICON_DIR, { recursive: true });
      }

      await writeFile(filePath, Buffer.from(faviconResult.data));
      console.log("[Favicon API] Saved successfully, returning:", publicUrl);
    } catch (writeError) {
      console.error("[Favicon API] Failed to save file:", writeError);
      console.error("[Favicon API] Directory:", FAVICON_DIR);
      console.error("[Favicon API] File path:", filePath);
      // Return the favicon data as base64 if we can't save to disk
      const base64 = Buffer.from(faviconResult.data).toString("base64");
      const dataUrl = `data:${faviconResult.contentType};base64,${base64}`;
      return NextResponse.json({ favicon: dataUrl });
    }

    return NextResponse.json({ favicon: publicUrl });
  } catch (error) {
    console.error("[Favicon API] Error:", error);
    return NextResponse.json({ favicon: null });
  }
}
