import { auth } from "@/auth";
import { db } from "@/lib/db";
import { workspaces, tasks, deals, contacts, meetings, kpis, alerts, agent_runs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE() {
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

    // Delete in order to respect any foreign key constraints (if any)
    await db.delete(tasks).where(eq(tasks.workspace_id, ws.id));
    await db.delete(deals).where(eq(deals.workspace_id, ws.id));
    await db.delete(contacts).where(eq(contacts.workspace_id, ws.id));
    await db.delete(meetings).where(eq(meetings.workspace_id, ws.id));
    await db.delete(kpis).where(eq(kpis.workspace_id, ws.id));
    await db.delete(alerts).where(eq(alerts.workspace_id, ws.id));
    await db.delete(agent_runs).where(eq(agent_runs.workspace_id, ws.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
