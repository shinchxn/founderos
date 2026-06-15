import { auth } from "@/auth";
import { db } from "@/lib/db";
import { meetings, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { processMeeting } from "@/lib/agents/meeting-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, id),
        eq(meetings.workspace_id, ws.id)
      ),
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Process the meeting synchronously or in a way the client can await
    await processMeeting(id);

    // Retrieve the updated meeting
    const updatedMeeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, id),
    });

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
