import { invokeClaudeSonnet } from "../bedrock";
import { db } from "../db";
import { kpis, tasks, deals, meetings, investor_updates, agent_runs, agent_hours_saved } from "../db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import crypto from "crypto";

export async function processInvestorUpdate(workspaceId: string) {
  const runId = crypto.randomUUID();
  await db.insert(agent_runs).values({
    id: runId,
    workspace_id: workspaceId,
    agent_type: "investor_update",
    status: "running",
    triggered_by: "cron",
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const kpiData = await db.query.kpis.findFirst({
    where: eq(kpis.workspace_id, workspaceId),
    orderBy: [desc(kpis.week_start)],
  });

  const completedTasks = await db.query.tasks.findMany({
    where: and(
        eq(tasks.workspace_id, workspaceId),
        eq(tasks.status, "done"),
        gte(tasks.updated_at, oneWeekAgo)
    ),
  });

  const overdueTasks = await db.query.tasks.findMany({
    where: and(
        eq(tasks.workspace_id, workspaceId),
        eq(tasks.status, "todo"),
        lte(tasks.due_date, now)
    ),
  });

  const changedDeals = await db.query.deals.findMany({
    where: and(
        eq(deals.workspace_id, workspaceId),
        gte(deals.updated_at, oneWeekAgo)
    ),
  });

  const recentMeetings = await db.query.meetings.findMany({
    where: and(
        eq(meetings.workspace_id, workspaceId),
        gte(meetings.meeting_date, oneWeekAgo)
    ),
  });

  const prompt = `Generate a weekly investor update from this data:
KPIs: ${JSON.stringify(kpiData)}
Completed Tasks: ${completedTasks.map(t => t.title).join(", ")}
Overdue Tasks: ${overdueTasks.map(t => t.title).join(", ")}
Deals Updated: ${changedDeals.map(d => `${d.title} (Stage: ${d.stage})`).join(", ")}
Meetings: ${recentMeetings.map(m => m.title).join(", ")}
`;

  const systemPrompt = "You are an expert startup advisor writing honest clear weekly investor updates. Use plain English. Be specific with numbers. Under 300 words. Never use placeholder text.";
  const startTime = Date.now();

  try {
    const responseText = await invokeClaudeSonnet(systemPrompt, prompt, 2048);
    
    await db.insert(investor_updates).values({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      week_start: oneWeekAgo,
      subject: `Weekly Update - ${now.toISOString().split('T')[0]}`,
      body: responseText,
      status: "draft",
      agent_generated: true,
    });

    // Hours saved: 45 mins per update
    await db.insert(agent_hours_saved).values({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      agent_type: "investor_update",
      action_description: `Drafted investor update`,
      estimated_minutes_saved: 45,
    });

    await db.update(agent_runs).set({
      status: "completed",
      prompt_sent: prompt,
      raw_ai_response: responseText,
      duration_ms: Date.now() - startTime,
      items_processed: 1,
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
