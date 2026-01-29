import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = path.join(UPLOADS_DIR, ...pathSegments);

  // Security: ensure the path is within uploads directory
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(UPLOADS_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(normalizedPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const fileBuffer = await readFile(normalizedPath);
    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Uploads API] Error serving file:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
