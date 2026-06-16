import { auth } from "@/auth";
import { db } from "@/lib/db";
import { workspaces, workspace_integrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import crypto from "crypto";
import Stripe from "stripe";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.APP_URL || "http://localhost:3000"}/login`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  const APP_URL = process.env.APP_URL || "http://localhost:3000";

  if (error) {
    console.error("Stripe OAuth Error:", error, error_description);
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe=error`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe=missing_code`);
  }

  try {
    const ws = await db.query.workspaces.findFirst({
      where: eq(workspaces.owner_id, session.user.id),
    });

    if (!ws) {
      return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe=no_workspace`);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
    
    // Exchange the code for the token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    if (!response.stripe_user_id || !response.access_token) {
      throw new Error("Invalid response from Stripe");
    }

    const encryptedAccessToken = encrypt(response.access_token);
    const encryptedRefreshToken = response.refresh_token ? encrypt(response.refresh_token) : null;

    // Check if integration already exists
    const existing = await db.query.workspace_integrations.findFirst({
      where: (wi, { and, eq }) => and(
        eq(wi.workspace_id, ws.id),
        eq(wi.provider, "stripe_connect")
      )
    });

    if (existing) {
      await db.update(workspace_integrations).set({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        external_account_id: response.stripe_user_id,
        status: "active",
      }).where(eq(workspace_integrations.id, existing.id));
    } else {
      await db.insert(workspace_integrations).values({
        id: `wi_${crypto.randomUUID()}`,
        workspace_id: ws.id,
        provider: "stripe_connect",
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        external_account_id: response.stripe_user_id,
        status: "active",
      });
    }

    return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe=success`);
  } catch (err: any) {
    console.error("Stripe token exchange failed:", err.message);
    return NextResponse.redirect(`${process.env.APP_URL || "http://localhost:3000"}/dashboard/settings?stripe=error`);
  }
}
