import { db } from "../db";
import { kpis, workspace_integrations } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "../crypto";
import Stripe from "stripe";
import crypto from "crypto";

export async function syncStripeKpis(workspaceId: string) {
  try {
    const integration = await db.query.workspace_integrations.findFirst({
      where: and(
        eq(workspace_integrations.workspace_id, workspaceId),
        eq(workspace_integrations.provider, "stripe_connect"),
        eq(workspace_integrations.status, "active")
      )
    });

    if (!integration || !integration.access_token) {
      return { success: false, error: "No active Stripe integration" };
    }

    const accessToken = decrypt(integration.access_token);
    
    const connectedStripe = new Stripe(accessToken, { apiVersion: "2024-04-10" });

    // Determine current week start
    const now = new Date();
    const currentDay = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - currentDay);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartUnix = Math.floor(weekStart.getTime() / 1000);
    const nowUnix = Math.floor(now.getTime() / 1000);

    // Subscriptions created this week
    const subscriptions = await connectedStripe.subscriptions.list({
      created: { gte: weekStartUnix, lte: nowUnix },
      status: "all",
      limit: 100,
    });

    let new_signups = 0;
    let churn_count = 0;
    for (const sub of subscriptions.data) {
      if (sub.status === "active" || sub.status === "trialing") {
        new_signups++;
      } else if (sub.status === "canceled") {
        churn_count++;
      }
    }

    // To get active users and MRR, we need active subscriptions
    const activeSubscriptions = await connectedStripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    const active_users = activeSubscriptions.data.length;
    let mrr = 0;

    for (const sub of activeSubscriptions.data) {
      for (const item of sub.items.data) {
        if (item.price.unit_amount) {
          let amount = item.price.unit_amount * (item.quantity || 1);
          // Normalize to monthly
          if (item.price.recurring?.interval === "year") {
            amount = Math.round(amount / 12);
          } else if (item.price.recurring?.interval === "week") {
            amount = amount * 4;
          }
          // Convert from cents to dollars
          mrr += Math.round(amount / 100);
        }
      }
    }

    // Upsert KPIs
    const existingKpi = await db.query.kpis.findFirst({
      where: and(
        eq(kpis.workspace_id, workspaceId),
        eq(kpis.week_start, weekStart)
      )
    });

    if (existingKpi) {
      await db.update(kpis).set({
        mrr,
        arr: mrr * 12,
        new_signups,
        churn_count,
        active_users,
        stripe_synced: true,
      }).where(eq(kpis.id, existingKpi.id));
    } else {
      await db.insert(kpis).values({
        id: `kpi_${crypto.randomUUID()}`,
        workspace_id: workspaceId,
        week_start: weekStart,
        mrr,
        arr: mrr * 12,
        new_signups,
        churn_count,
        active_users,
        runway_months: 12, // Default
        stripe_synced: true,
      });
    }

    await db.update(workspace_integrations).set({
      last_synced_at: new Date(),
    }).where(eq(workspace_integrations.id, integration.id));

    return { success: true };
  } catch (error: any) {
    console.error("Stripe sync failed:", error.message);
    return { success: false, error: error.message };
  }
}
