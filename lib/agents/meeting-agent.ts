import { invokeClaudeHaiku } from "../bedrock";
import { db } from "../db";
import { meetings, tasks, alerts, agent_runs, agent_hours_saved } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function processMeeting(meetingId: string) {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
  });

  if (!meeting || !meeting.raw_notes) return;

  const runId = crypto.randomUUID();
  await db.insert(agent_runs).values({
    id: runId,
    workspace_id: meeting.workspace_id,
    agent_type: "meeting_intelligence",
    status: "running",
    triggered_by: "cron",
  });

const trimmedNotes = meeting.raw_notes.substring(0, 15000);
  const prompt = `You are an AI assistant extracting structured data from startup meeting notes. Respond with ONLY valid JSON. No explanation. No markdown. No code blocks.
Meeting title: ${meeting.title}
Meeting date: ${meeting.meeting_date.toISOString()}
Notes: ${trimmedNotes}
Return exactly this JSON structure:
{
"summary": "2 to 3 sentence summary",
"action_items": [{"title": "string", "assignee": "string or null", "due_date": "YYYY-MM-DD or null", "priority": "low or medium or high"}],
"decisions": ["string"],
"risks": ["string"],
"crm_entities": [{"name": "string", "type": "contact or company", "context": "string"}],
"sentiment": "positive or neutral or negative"
}`;

  const startTime = Date.now();

  try {
    const responseText = await invokeClaudeHaiku(prompt, 2048);
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Strip markdown code blocks Claude sometimes adds
      const cleaned = responseText.replace(/```json\n?|```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    await db.update(meetings).set({
      processed: true,
      processed_at: new Date(),
      extracted_data: data,
    }).where(eq(meetings.id, meetingId));

    if (data.action_items && data.action_items.length > 0) {
      const tasksToInsert = data.action_items.map((item: any) => ({
        id: crypto.randomUUID(),
        workspace_id: meeting.workspace_id,
        title: item.title,
        status: "todo",
        priority: item.priority || "medium",
        assignee_email: item.assignee,
        due_date: item.due_date ? new Date(item.due_date) : null,
        source: "agent",
        linked_entity_type: "meeting",
        linked_entity_id: meetingId,
      }));
      await db.insert(tasks).values(tasksToInsert);
      
      // Hours saved: 15 mins per task
      await db.insert(agent_hours_saved).values({
        id: crypto.randomUUID(),
        workspace_id: meeting.workspace_id,
        agent_type: "meeting_intelligence",
        action_description: `Extracted ${tasksToInsert.length} tasks from meeting`,
        estimated_minutes_saved: 15 * tasksToInsert.length,
      });
    }

    if (data.risks && data.risks.length > 0) {
      const risksToInsert = data.risks.map((risk: string) => ({
        id: crypto.randomUUID(),
        workspace_id: meeting.workspace_id,
        type: "anomaly",
        title: "Meeting Risk Identified",
        body: risk,
        severity: "medium",
      }));
      await db.insert(alerts).values(risksToInsert);
    }

    await db.update(agent_runs).set({
      status: "completed",
      prompt_sent: prompt,
      raw_ai_response: responseText,
      duration_ms: Date.now() - startTime,
      items_processed: (data.action_items?.length || 0) + (data.risks?.length || 0) + (data.decisions?.length || 0),
      output_summary: `Extracted ${data.action_items?.length || 0} tasks from "${meeting.title}".`,
      completed_at: new Date(),
    }).where(eq(agent_runs.id, runId));

  } catch (error: any) {
    await db.update(agent_runs).set({
      status: "failed",
      prompt_sent: prompt,
      error_message: error.message,
      duration_ms: Date.now() - startTime,
      completed_at: new Date(),
    }).where(eq(agent_runs.id, runId));
  }
}
