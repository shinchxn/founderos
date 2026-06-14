import { auth } from "@/auth";
import { db } from "@/lib/db";
import { agent_runs, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { processAnomalies } from "@/lib/agents/anomaly-agent";
import { processSalesDigest } from "@/lib/agents/sales-digest-agent";
import { processInvestorUpdate } from "@/lib/agents/investor-update-agent";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ws = await db.query.workspaces.findFirst({
      where: eq(workspaces.owner_id, session.user.id),
    });

    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const runs = await db.query.agent_runs.findMany({
      where: eq(agent_runs.workspace_id, ws.id),
      orderBy: [desc(agent_runs.created_at)],
      limit: 100,
    });

    return NextResponse.json(runs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ws = await db.query.workspaces.findFirst({
      where: eq(workspaces.owner_id, session.user.id),
    });

    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { agent_type } = await req.json();

    if (!agent_type) {
      return NextResponse.json({ error: "Missing required field: agent_type" }, { status: 400 });
    }

    // Trigger specified agent in the background so the request doesn't block
    if (agent_type === "anomaly_detection") {
      processAnomalies(ws.id).catch(err => console.error("Anomaly agent crash:", err));
    } else if (agent_type === "sales_digest") {
      processSalesDigest(ws.id).catch(err => console.error("Sales digest crash:", err));
    } else if (agent_type === "investor_update") {
      processInvestorUpdate(ws.id).catch(err => console.error("Investor update agent crash:", err));
    } else {
      return NextResponse.json({ error: `Invalid agent_type: ${agent_type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Agent ${agent_type} scheduled to run in background.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
