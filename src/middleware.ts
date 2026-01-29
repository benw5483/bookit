import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicAsset =
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/favicon") ||
    req.nextUrl.pathname.includes(".");

  // Allow public assets and auth API routes
  if (isPublicAsset || isAuthRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Protect all other routes
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
