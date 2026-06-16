import { NextResponse } from "next/server";
import { auth } from "@/auth";
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
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.owner_id !== authSession.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let customerId = workspace.stripe_customer_id;

    if (!customerId) {
        const customer = await getStripe().customers.create({
            metadata: { workspaceId }
        });
        customerId = customer.id;
        await db.update(workspaces).set({ stripe_customer_id: customerId }).where(eq(workspaces.id, workspaceId));
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard/settings?upgrade=success`,
      cancel_url: `${APP_URL}/dashboard/settings?upgrade=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
