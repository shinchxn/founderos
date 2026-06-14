import { NextResponse } from "next/server";
import { processAnomalies } from "../../../../lib/agents/anomaly-agent";
import { processInvestorUpdate } from "../../../../lib/agents/investor-update-agent";
import { processSalesDigest } from "../../../../lib/agents/sales-digest-agent";
import { db } from "../../../../lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allWorkspaces = await db.query.workspaces.findMany();
    
    for (const ws of allWorkspaces) {
      // 1. Run Anomaly Agent Daily
      await processAnomalies(ws.id);
      
      // 2. Run Sales Digest Agent Daily
      await processSalesDigest(ws.id);
      
      // 3. Run Investor Update Agent on Fridays only
      const today = new Date();
      if (today.getDay() === 5) {
        await processInvestorUpdate(ws.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
