import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { meetings, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MeetingCapture } from "./MeetingCapture";
import { MeetingHistory } from "./MeetingHistory";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get workspace
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id),
  });

  if (!ws) {
    return <div className="p-6">No workspace found. Please sign in again.</div>;
  }

  // Find meetings
  const workspaceMeetings = await db.query.meetings.findMany({
    where: eq(meetings.workspace_id, ws.id),
    orderBy: (meetings, { desc }) => [desc(meetings.meeting_date)],
  });

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)] overflow-hidden">
      <div className="mb-6 flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Meetings & Transcripts</h2>
          <p className="text-sm text-muted">Upload raw team or client transcripts to extract real milestones, tasks, and sentiment via safe Bedrock AI agents.</p>
        </div>
      </div>

      {/* Capture Input Panel */}
      <MeetingCapture />

      {/* Interactive Logger & details Explorer */}
      <MeetingHistory initialMeetings={workspaceMeetings} />
    </div>
  );
}
