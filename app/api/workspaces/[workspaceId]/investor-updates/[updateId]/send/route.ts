import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { investor_updates, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendInvestorUpdate } from "@/lib/ses";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; updateId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { workspaceId, updateId } = resolvedParams;

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (!workspace.investor_email) {
      return NextResponse.json({ error: "No investor email configured for workspace" }, { status: 400 });
    }

    const update = await db.query.investor_updates.findFirst({
      where: and(
        eq(investor_updates.id, updateId),
        eq(investor_updates.workspace_id, workspaceId)
      ),
    });

    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    await sendInvestorUpdate(workspace.investor_email, update.subject, update.body);

    await db.update(investor_updates).set({
      status: "sent",
      sent_at: new Date(),
      sent_to_email: workspace.investor_email,
    }).where(eq(investor_updates.id, updateId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
