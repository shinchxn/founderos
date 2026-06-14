import { auth } from "@/auth";
import { db } from "@/lib/db";
import { meetings, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { processMeeting } from "@/lib/agents/meeting-agent";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const insertMeetingSchema = createInsertSchema(meetings, {
  meeting_date: z.coerce.date().optional(),
}).omit({ id: true, workspace_id: true, created_at: true, updated_at: true, processed: true, processed_at: true, extracted_data: true, s3_key: true, attendees: true });

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

    const rawBody = await req.json();
    const body = insertMeetingSchema.safeParse(rawBody);

    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { title, raw_notes, meeting_date } = body.data;

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
