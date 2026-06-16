import { auth } from "@/auth";
import { db } from "@/lib/db";
import { investor_updates, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendInvestorUpdate } from "@/lib/ses";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const updateRecord = await db.query.investor_updates.findFirst({
      where: and(
        eq(investor_updates.id, id),
        eq(investor_updates.workspace_id, ws.id)
      ),
    });

    if (!updateRecord) {
      return NextResponse.json({ error: "Investor update record not found" }, { status: 404 });
    }

    const recipient = ws.investor_email || "investors@startup.com";

    // Check if AWS environment and sender emails are configured
    const isAwsConfigured = 
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY && 
      process.env.AWS_SES_FROM_EMAIL;

    if (!isAwsConfigured) {
      await db.update(investor_updates).set({
        status: "failed",
        send_error: "AWS SES credentials or AWS_SES_FROM_EMAIL are missing.",
        updated_at: new Date(),
      }).where(eq(investor_updates.id, id));
      return NextResponse.json({ success: false, error: "AWS SES credentials or AWS_SES_FROM_EMAIL are missing." }, { status: 502 });
    }

    let messageId;
    try {
      messageId = await sendInvestorUpdate(recipient, updateRecord.subject, updateRecord.body);
    } catch (sesErr: any) {
      await db.update(investor_updates).set({
        status: "failed",
        send_error: sesErr.message,
        updated_at: new Date(),
      }).where(eq(investor_updates.id, id));
      return NextResponse.json({ success: false, error: sesErr.message }, { status: 502 });
    }

    // Update the database status to sent
    const [updated] = await db.update(investor_updates).set({
      status: "sent",
      sent_at: new Date(),
      sent_to_email: recipient,
      send_error: null,
      updated_at: new Date(),
    }).where(eq(investor_updates.id, id)).returning();

    return NextResponse.json({
      success: true,
      update: updated,
      messageId,
      sentViaAws: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
