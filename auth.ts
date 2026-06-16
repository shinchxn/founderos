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
import { db, getInstance } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  workspaces,
  workspace_integrations,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import crypto from "crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: DrizzleAdapter(getInstance(), {
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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly"
        }
      }
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    // Auto-provision workspace on first sign-in
    async signIn({ user, account }) {
      if (!user?.id || !user?.email) return true;
      try {
        let wsId = "";
        const existing = await db
          .select()
          .from(workspaces)
          .where(eq(workspaces.owner_id, user.id))
          .limit(1);

        if (existing.length === 0) {
          wsId = `ws_${Date.now()}`;
          const slug = user.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          await db.insert(workspaces).values({
            id: wsId,
            name: user.name || "My Startup",
            slug,
            owner_id: user.id,
            plan: "free",
            setup_completed: false,
          });
        } else {
          wsId = existing[0].id;
        }

        if (account?.provider === "google" && account.refresh_token && process.env.ENCRYPTION_KEY) {
          const encryptedRefreshToken = encrypt(account.refresh_token);
          const encryptedAccessToken = account.access_token ? encrypt(account.access_token) : null;
          
          const existingIntegration = await db.query.workspace_integrations.findFirst({
             where: (wi, { and, eq }) => and(
               eq(wi.workspace_id, wsId),
               eq(wi.provider, "google_calendar")
             )
          });

          if (existingIntegration) {
             await db.update(workspace_integrations).set({
               refresh_token: encryptedRefreshToken,
               access_token: encryptedAccessToken,
               status: "active",
               connected_at: new Date()
             }).where(eq(workspace_integrations.id, existingIntegration.id));
          } else {
             await db.insert(workspace_integrations).values({
               id: `wi_${crypto.randomUUID()}`,
               workspace_id: wsId,
               provider: "google_calendar",
               refresh_token: encryptedRefreshToken,
               access_token: encryptedAccessToken,
               status: "active"
             });
          }
        }
      } catch (err) {
        console.error("[Auth] Workspace provisioning or token storage failed:", err);
        // Don't block sign-in if fails
      }
      return true;
    },
  },
});