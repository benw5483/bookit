import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchAndSaveFavicon } from "@/lib/favicon";

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
    const favicon = await fetchAndSaveFavicon(url);
    return NextResponse.json({ favicon });
  } catch (error) {
    console.error("[Favicon API] Error:", error);
    return NextResponse.json({ favicon: null });
  }
}
