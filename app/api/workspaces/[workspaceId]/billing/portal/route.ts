import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { workspaces } from "../../../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is missing");
    stripeClient = new Stripe(key, { apiVersion: "2024-04-10" });
  }
  return stripeClient;
}
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (!workspace.stripe_customer_id) {
        return NextResponse.json({ error: "No billing portal. Customer not found." }, { status: 400 });
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
        customer: workspace.stripe_customer_id,
        return_url: `${APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
