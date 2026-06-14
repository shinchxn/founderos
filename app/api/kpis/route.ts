import { auth } from "@/auth";
import { db } from "@/lib/db";
import { kpis, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

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

    const kpiData = await db.query.kpis.findMany({
      where: eq(kpis.workspace_id, ws.id),
      orderBy: [desc(kpis.week_start)],
      limit: 52,
    });

    return NextResponse.json(kpiData);
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

    const body = await req.json();
    const { week_start, mrr, arr, new_signups, churn_count, active_users, runway_months, notes, anomalies } = body;

    if (!week_start || mrr === undefined) {
      return NextResponse.json({ error: "Missing required fields: week_start, mrr" }, { status: 400 });
    }

    const newKpiId = `kpi_${crypto.randomUUID()}`;
    const [inserted] = await db.insert(kpis).values({
      id: newKpiId,
      workspace_id: ws.id,
      week_start: new Date(week_start),
      mrr: parseInt(mrr, 10) || 0,
      arr: parseInt(arr, 10) || (parseInt(mrr, 10) * 12) || 0,
      new_signups: parseInt(new_signups, 10) || 0,
      churn_count: parseInt(churn_count, 10) || 0,
      active_users: parseInt(active_users, 10) || 0,
      runway_months: parseInt(runway_months, 10) || 12,
      notes: notes || null,
      anomalies: anomalies || null,
    }).returning();

    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
