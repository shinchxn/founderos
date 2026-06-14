import { auth } from "@/auth";
import { db } from "@/lib/db";
import { meetings, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { processMeeting } from "@/lib/agents/meeting-agent";

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

    const allMeetings = await db.query.meetings.findMany({
      where: eq(meetings.workspace_id, ws.id),
      orderBy: [desc(meetings.meeting_date)],
    });

    return NextResponse.json(allMeetings);
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
    const { title, raw_notes, meeting_date } = body;

    if (!title || !raw_notes) {
      return NextResponse.json({ error: "Missing required fields: title, raw_notes" }, { status: 400 });
    }

    const newMeetingId = `mtg_${crypto.randomUUID()}`;
    const [inserted] = await db.insert(meetings).values({
      id: newMeetingId,
      workspace_id: ws.id,
      title,
      meeting_date: meeting_date ? new Date(meeting_date) : new Date(),
      raw_notes,
      processed: false,
    }).returning();

    // Trigger AI background processing
    processMeeting(newMeetingId).catch((err) => {
      console.error("AI meeting processing background failure:", err);
    });

    return NextResponse.json({
      ...inserted,
      processingTriggered: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
