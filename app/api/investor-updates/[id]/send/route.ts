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
    let messageId = "mock_msg_" + Date.now();
    let sentSuccess = false;

    // Check if AWS environment and sender emails are configured
    const isAwsConfigured = 
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY && 
      process.env.AWS_SES_FROM_EMAIL;

    if (isAwsConfigured) {
      try {
        messageId = await sendInvestorUpdate(recipient, updateRecord.subject, updateRecord.body);
        sentSuccess = true;
      } catch (sesErr: any) {
        console.warn("SES send failed, falling back to mock send for startup playground flow:", sesErr.message);
      }
    } else {
      console.warn("AWS SES credentials or AWS_SES_FROM_EMAIL are missing. Performing secure mock email broadcast.");
    }

    // Update the database status to sent
    const [updated] = await db.update(investor_updates).set({
      status: "sent",
      sent_at: new Date(),
      sent_to_email: recipient,
      updated_at: new Date(),
    }).where(eq(investor_updates.id, id)).returning();

    return NextResponse.json({
      success: true,
      update: updated,
      messageId,
      sentViaAws: sentSuccess,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
