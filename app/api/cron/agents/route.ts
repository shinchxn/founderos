import { NextResponse } from "next/server";
import { processAnomalies } from "../../../../lib/agents/anomaly-agent";
import { processInvestorUpdate } from "../../../../lib/agents/investor-update-agent";
import { processSalesDigest } from "../../../../lib/agents/sales-digest-agent";
import { syncStripeKpis } from "../../../../lib/integrations/stripe-sync";
import { db } from "../../../../lib/db";
import pLimit from "p-limit";
import { agent_runs } from "../../../../lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allWorkspaces = await db.query.workspaces.findMany();
    
    const limit = pLimit(3);
    const today = new Date();
    const isFriday = today.getDay() === 5;

    await Promise.allSettled(
      allWorkspaces.map(ws => limit(async () => {
        const wsPlan = ws.plan || "free";
        if (wsPlan === "free" && !isFriday) {
          return; // Skip free tier workspaces except on Friday
        }

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentRuns = await db.query.agent_runs.findMany({
          where: and(
            eq(agent_runs.workspace_id, ws.id),
            gte(agent_runs.created_at, oneHourAgo)
          )
        });

        if (recentRuns.length > 5) {
          console.warn(`[Cron] Skipping workspace ${ws.id} due to rate limit (>5 agent runs in last hour)`);
          return;
        }

        await syncStripeKpis(ws.id);
        await processAnomalies(ws.id);
        await processSalesDigest(ws.id);
        if (isFriday) {
          await processInvestorUpdate(ws.id);
        }
      }))
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
