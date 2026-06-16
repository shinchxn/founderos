import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/integrations/stripe-connect/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Stripe Connect is not configured." }, { status: 500 });
  }

  const state = session.user.id; 

  const stripeAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_only&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(stripeAuthUrl);
}
