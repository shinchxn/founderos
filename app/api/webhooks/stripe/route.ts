import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { workspaces, stripe_webhook_events } from "../../../../lib/db/schema";
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
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature || "", webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    const existingEvent = await db.query.stripe_webhook_events.findFirst({
      where: eq(stripe_webhook_events.id, event.id),
    });

    if (existingEvent) {
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        await db.update(workspaces)
            .set({ 
                plan: "pro", 
                stripe_subscription_id: subscription.id 
            })
            .where(eq(workspaces.stripe_customer_id, customerId));
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        await db.update(workspaces)
            .set({ 
                plan: "free", 
                stripe_subscription_id: null 
            })
            .where(eq(workspaces.stripe_customer_id, customerId));
        break;
      }
    }

    await db.insert(stripe_webhook_events).values({
      id: event.id,
      type: event.type,
      processed_at: new Date(),
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
  }
}
