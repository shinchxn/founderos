import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRatelimit } from "@/lib/ratelimit";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth/signin") || pathname.startsWith("/api/auth/callback")) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ratelimit = getRatelimit(5, "1 m");
    const { success } = await ratelimit.limit(`signin_${ip}`);
    if (!success) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please try again later." }, { status: 429 });
    }
  }

  // Check for the presence of the session token cookie
  // This avoids NextAuth Edge JWT parsing crash since we use database sessions!
  const sessionToken = req.cookies.get("authjs.session-token")?.value || 
                       req.cookies.get("__Secure-authjs.session-token")?.value;
  const isLoggedIn = !!sessionToken;

  // Protect cron routes with bearer token — checked before any auth logic
  if (pathname.startsWith("/api/cron/")) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/deals") ||
    pathname.startsWith("/meetings") ||
    pathname.startsWith("/revenue") ||
    pathname.startsWith("/investors") ||
    pathname.startsWith("/agents") ||
    pathname.startsWith("/digest") ||
    pathname.startsWith("/settings");

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};