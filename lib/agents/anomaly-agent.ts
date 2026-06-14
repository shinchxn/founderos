import { db } from "../db";
import { kpis, alerts, deals, agent_runs, agent_hours_saved } from "../db/schema";
import { eq, desc, and, lte, gte } from "drizzle-orm";
import crypto from "crypto";

export async function processAnomalies(workspaceId: string) {
  const runId = crypto.randomUUID();
  await db.insert(agent_runs).values({
    id: runId,
    workspace_id: workspaceId,
    agent_type: "anomaly_detection",
    status: "running",
    triggered_by: "cron",
  });

  const startTime = Date.now();
  let alertsCreated = 0;

  try {
    const recentKpis = await db.query.kpis.findMany({
      where: eq(kpis.workspace_id, workspaceId),
      orderBy: [desc(kpis.week_start)],
      limit: 2,
    });

    if (recentKpis.length === 2) {
      const [current, previous] = recentKpis;
      
      const checkAnomaly = async (metric: string, currVal: number, prevVal: number, decreaseThreshold: number, increaseThreshold: number, absoluteThreshold: number) => {
        if (prevVal === 0) return;
        const pctChange = ((currVal - prevVal) / prevVal) * 100;
        
        let anomalous = false;
        if (pctChange < -decreaseThreshold) anomalous = true;
        if (pctChange > increaseThreshold) anomalous = true;
        if (Math.abs(pctChange) > absoluteThreshold) anomalous = true;

        if (anomalous) {
          const title = `${metric} Anomaly Detected`;
          
          // Deduplicate in last 7 days
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const existing = await db.query.alerts.findFirst({
            where: and(
              eq(alerts.workspace_id, workspaceId),
              eq(alerts.title, title),
              gte(alerts.created_at, sevenDaysAgo)
            )
          });

          if (!existing) {
            await db.insert(alerts).values({
              id: crypto.randomUUID(),
              workspace_id: workspaceId,
              type: "anomaly",
              title,
              body: `${metric} changed by ${pctChange.toFixed(2)}% from ${prevVal} to ${currVal}.`,
              severity: "high",
            });
            alertsCreated++;
          }
        }
      };

      await checkAnomaly("MRR", current.mrr, previous.mrr, 15, 100, 30);
      await checkAnomaly("New Signups", current.new_signups, previous.new_signups, 20, 100, 30);
      await checkAnomaly("Active Users", current.active_users, previous.active_users, 15, 100, 30);
      await checkAnomaly("Churn", current.churn_count, previous.churn_count, -100, 15, 30);

      if (current.runway_months < 6) {
         const title = "Critically Low Runway";
         const existing = await db.query.alerts.findFirst({
            where: and(
              eq(alerts.workspace_id, workspaceId),
              eq(alerts.title, title),
              gte(alerts.created_at, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            )
          });
          if (!existing) {
             await db.insert(alerts).values({
                id: crypto.randomUUID(),
                workspace_id: workspaceId,
                type: "anomaly",
                title,
                body: `Runway dropped to ${current.runway_months} months.`,
                severity: "high",
             });
             alertsCreated++;
          }
      }
    }

    // Check cold deals (14 days no update)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const coldDeals = await db.query.deals.findMany({
      where: and(
        eq(deals.workspace_id, workspaceId),
        lte(deals.updated_at, fourteenDaysAgo)
      )
    });

    for (const deal of coldDeals) {
      if (['won', 'lost'].includes(deal.stage)) continue;
      
      const title = `Cold Deal: ${deal.title}`;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const existing = await db.query.alerts.findFirst({
        where: and(
          eq(alerts.workspace_id, workspaceId),
          eq(alerts.title, title),
          gte(alerts.created_at, sevenDaysAgo)
        )
      });

      if (!existing) {
        await db.insert(alerts).values({
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          type: "cold_deal",
          title,
          body: `Deal ${deal.title} has not been updated in 14 days.`,
          severity: "medium",
        });
        alertsCreated++;
      }
    }

    if (alertsCreated > 0) {
      await db.insert(agent_hours_saved).values({
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        agent_type: "anomaly_detection",
        action_description: `Detected ${alertsCreated} anomalies/alerts`,
        estimated_minutes_saved: 10 * alertsCreated,
      });
    }

    await db.update(agent_runs).set({
      status: "completed",
      duration_ms: Date.now() - startTime,
      items_processed: alertsCreated,
      output_summary: `Detected ${alertsCreated} anomaly alerts.`,
      completed_at: new Date(),
    }).where(eq(agent_runs.id, runId));

  } catch (error: any) {
    await db.update(agent_runs).set({
      status: "failed",
      error_message: error.message,
      duration_ms: Date.now() - startTime,
      completed_at: new Date(),
    }).where(eq(agent_runs.id, runId));
  }
}
