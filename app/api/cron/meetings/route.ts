import { NextResponse } from "next/server";
import { processMeeting } from "../../../../lib/agents/meeting-agent";
import { db } from "../../../../lib/db";
import { meetings } from "../../../../lib/db/schema";
import { eq, and, lte } from "drizzle-orm";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    // Find unprocessed meetings older than 2 minutes
    const pendingMeetings = await db.query.meetings.findMany({
      where: and(
        eq(meetings.processed, false),
        lte(meetings.created_at, twoMinutesAgo)
      )
    });
    
    for (const meeting of pendingMeetings) {
      await processMeeting(meeting.id);
    }

    return NextResponse.json({ success: true, processedCount: pendingMeetings.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
