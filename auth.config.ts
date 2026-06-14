/**
 * auth.config.ts — EDGE-SAFE config
 *
 * Imported by middleware.ts (Edge runtime).
 * MUST NOT import: bcrypt, postgres, drizzle, or any Node-only module.
 * Strategy is "database" — sessions are stored in DB and verified by token cookie.
 * The middleware only checks for the presence of the session token cookie.
 */
import type { NextAuthConfig } from "next-auth";
import type { DefaultSession } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [], // Full providers live in auth.ts only
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // NOTE: No session.strategy here — let DrizzleAdapter in auth.ts control it.
  // Mixing "jwt" strategy with an adapter causes the middleware redirect loop.
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

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

      const isAuthPage =
        pathname === "/login" || pathname === "/signup";

      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      if (!isLoggedIn && isProtected) {
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        (session.user as any).plan = (user as any).plan ?? "free";
        (session.user as any).totalHoursSaved =
          (user as any).totalHoursSaved ?? "0";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: string;
      totalHoursSaved: string;
    } & DefaultSession["user"];
  }
}