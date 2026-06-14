"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { meetings, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { processMeeting } from "@/lib/agents/meeting-agent";

export async function createMeetingAndProcess(title: string, rawNotes: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userWorkspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id),
  });

  if (!userWorkspace) return { error: "No workspace found" };

  const meetingId = `mtg_${crypto.randomUUID()}`;

  await db.insert(meetings).values({
    id: meetingId,
    workspace_id: userWorkspace.id,
    title,
    meeting_date: new Date(),
    raw_notes: rawNotes,
    processed: false,
  });

  // Start processing in the background (we can await it if we want fast feedback)
  await processMeeting(meetingId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/meetings");
  revalidatePath("/dashboard/tasks");

  return { success: true, meetingId };
}
