import { writeFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const FAVICON_DIR = path.join(process.cwd(), "public", "uploads", "favicons");
const FETCH_TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Get parent domains to try (e.g., "sub.example.com" -> ["sub.example.com", "example.com"])
function getDomainVariants(domain: string): string[] {
  const parts = domain.split(".");
  const variants: string[] = [domain];

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

  try {
    const response = await fetchWithTimeout(googleFaviconUrl);
    if (response.ok) {
      const data = await response.arrayBuffer();
      if (data.byteLength > 500) {
        return {
          data,
          contentType: response.headers.get("content-type") || "image/png",
        };
      }
    }
  } catch {
    // Continue to next method
  }

  // Try direct favicon.ico
  try {
    const directUrl = `https://${domain}/favicon.ico`;
    const response = await fetchWithTimeout(directUrl);
    if (response.ok) {
      const data = await response.arrayBuffer();
      if (data.byteLength > 0) {
        return {
          data,
          contentType: response.headers.get("content-type") || "image/x-icon",
        };
      }
    }
  } catch {
    // Continue to next method
  }

  // Try apple-touch-icon
  try {
    const appleIconUrl = `https://${domain}/apple-touch-icon.png`;
    const response = await fetchWithTimeout(appleIconUrl);
    if (response.ok) {
      const data = await response.arrayBuffer();
      if (data.byteLength > 0) {
        return {
          data,
          contentType: "image/png",
        };
      }
    }
  } catch {
    // No more methods to try
  }

  return null;
}

export async function fetchAndSaveFavicon(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const originalDomain = urlObj.hostname;
    const hash = crypto.createHash("md5").update(originalDomain).digest("hex");

    // Ensure favicon directory exists
    if (!existsSync(FAVICON_DIR)) {
      await mkdir(FAVICON_DIR, { recursive: true });
    }

    // Check if we already have this favicon cached
    try {
      const files = await readdir(FAVICON_DIR);
      const existingFile = files.find((f) => f.startsWith(hash));
      if (existingFile) {
        return `/api/uploads/favicons/${existingFile}`;
      }
    } catch {
      // Directory might not exist yet
    }

    // Get domain variants to try
    const domains = getDomainVariants(originalDomain);
    let faviconResult: { data: ArrayBuffer; contentType: string } | null = null;

    for (const domain of domains) {
      faviconResult = await tryFetchFavicon(domain);
      if (faviconResult) break;
    }

    if (!faviconResult) {
      return null;
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

    try {
      if (!existsSync(FAVICON_DIR)) {
        await mkdir(FAVICON_DIR, { recursive: true });
      }
      await writeFile(filePath, Buffer.from(faviconResult.data));
      return publicUrl;
    } catch {
      // Return as base64 if we can't save to disk
      const base64 = Buffer.from(faviconResult.data).toString("base64");
      return `data:${faviconResult.contentType};base64,${base64}`;
    }
  } catch {
    return null;
  }
}
