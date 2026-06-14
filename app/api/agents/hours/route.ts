import { auth } from "@/auth";
import { db } from "@/lib/db";
import { agent_hours_saved, workspaces } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

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

    const result = await db
      .select({
        total_minutes: sql<number>`sum(estimated_minutes_saved)`,
        count_actions: sql<number>`count(id)`
      })
      .from(agent_hours_saved)
      .where(eq(agent_hours_saved.workspace_id, ws.id));

    const data = result[0] || { total_minutes: 0, count_actions: 0 };
    const totalMinutes = Number(data.total_minutes) || 0;
    const hoursSaved = parseFloat((totalMinutes / 60).toFixed(1));

    // Get metrics breakdown per agent type
    const breakdown = await db
      .select({
        agent_type: agent_hours_saved.agent_type,
        minutes: sql<number>`sum(estimated_minutes_saved)`
      })
      .from(agent_hours_saved)
      .where(eq(agent_hours_saved.workspace_id, ws.id))
      .groupBy(agent_hours_saved.agent_type);

    return NextResponse.json({
      totalMinutes,
      hoursSaved,
      actionCount: Number(data.count_actions) || 0,
      breakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
