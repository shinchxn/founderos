import { NextResponse } from "next/server";
import { processAnomalies } from "../../../../lib/agents/anomaly-agent";
import { processInvestorUpdate } from "../../../../lib/agents/investor-update-agent";
import { processSalesDigest } from "../../../../lib/agents/sales-digest-agent";
import { db } from "../../../../lib/db";
import pLimit from "p-limit";

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
