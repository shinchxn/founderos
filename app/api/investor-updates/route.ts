import { auth } from "@/auth";
import { db } from "@/lib/db";
import { investor_updates, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
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

    const updates = await db.query.investor_updates.findMany({
      where: eq(investor_updates.workspace_id, ws.id),
      orderBy: [desc(investor_updates.created_at)],
    });

    return NextResponse.json(updates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
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

    // Call the Bedrock investor update generator agent
    await processInvestorUpdate(ws.id);

    // Retrieve the newly created draft
    const latestCreated = await db.query.investor_updates.findFirst({
      where: eq(investor_updates.workspace_id, ws.id),
      orderBy: [desc(investor_updates.created_at)],
    });

    return NextResponse.json(latestCreated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
