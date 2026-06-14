/**
 * auth.ts — FULL server config
 *
 * Do NOT import this in middleware.ts — use auth.config.ts there instead.
 * DrizzleAdapter manages sessions in the database (not JWT).
 * The authorized() callback in auth.config.ts handles all route protection.
 */
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  workspaces,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    // Auto-provision workspace on first sign-in
    async signIn({ user }) {
      if (!user?.id || !user?.email) return true;
      try {
        const existing = await db
          .select()
          .from(workspaces)
          .where(eq(workspaces.owner_id, user.id))
          .limit(1);

        if (existing.length === 0) {
          const slug = user.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          await db.insert(workspaces).values({
            id: `ws_${Date.now()}`,
            name: user.name || "My Startup",
            slug,
            owner_id: user.id,
            plan: "free",
            setup_completed: false,
          });
        }
      } catch (err) {
        console.error("[Auth] Workspace provisioning failed:", err);
        // Don't block sign-in if workspace creation fails
      }
      return true;
    },
  },
});