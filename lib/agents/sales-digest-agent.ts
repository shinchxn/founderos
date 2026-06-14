import { invokeClaudeSonnet } from "../bedrock";
import { db } from "../db";
import { deals, tasks, agent_runs, agent_hours_saved } from "../db/schema";
import { eq, and, ne } from "drizzle-orm";
import crypto from "crypto";

export async function processSalesDigest(workspaceId: string) {
  const runId = crypto.randomUUID();
  await db.insert(agent_runs).values({
    id: runId,
    workspace_id: workspaceId,
    agent_type: "sales_digest",
    status: "running",
    triggered_by: "cron",
  });

  const startTime = Date.now();
  const now = new Date();

  try {
    const activeDeals = await db.query.deals.findMany({
      where: and(
        eq(deals.workspace_id, workspaceId),
        ne(deals.stage, 'won'),
        ne(deals.stage, 'lost')
      )
    });

    let itemsProcessed = 0;
    const promptData = activeDeals.map(deal => {
      let score = 0;
      let status = "healthy";
      
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      if (deal.expected_close_date && deal.expected_close_date < now) {
        score = Math.min(99, 80 + (deal.value / 10000));
        status = "at_risk";
      } else if (deal.updated_at && deal.updated_at < fourteenDaysAgo) {
        score = Math.min(79, 50 + (deal.value / 10000));
        status = "cold";
      } else {
        score = Math.min(49, (deal.value / 10000));
      }

      itemsProcessed++;
      return { id: deal.id, title: deal.title, value: deal.value, score: Math.round(score), status };
    });

    for (const d of promptData) {
       await db.update(deals).set({ priority_score: d.score }).where(eq(deals.id, d.id));
    }

    const prompt = `Here are the active deals grouped by priority:
${JSON.stringify(promptData)}
Generate exactly 3 high-impact follow-up tasks for the most critical deals. Return ONLY valid JSON:
[{"title": "task string", "deal_id": "id string", "priority": "high or medium"}]`;

    const systemPrompt = "You are a pragmatic VP of Sales. Only return valid JSON.";

    const responseText = await invokeClaudeSonnet(systemPrompt, prompt, 1024);
    const tasksArr = JSON.parse(responseText);

    for (const t of tasksArr) {
      if (itemsProcessed >= 3) break; // Limit
      await db.insert(tasks).values({
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        title: t.title,
        status: "todo",
        priority: t.priority,
        source: "agent",
        linked_entity_type: "deal",
        linked_entity_id: t.deal_id,
      });
    }

    await db.insert(agent_hours_saved).values({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      agent_type: "sales_digest",
      action_description: `Scored ${activeDeals.length} deals and generated ${tasksArr.length} tasks`,
      estimated_minutes_saved: 20,
    });

    await db.update(agent_runs).set({
      status: "completed",
      prompt_sent: prompt,
      raw_ai_response: responseText,
      duration_ms: Date.now() - startTime,
      items_processed: activeDeals.length,
      completed_at: new Date(),
    }).where(eq(agent_runs.id, runId));

  } catch (error: any) {
    await db.update(agent_runs).set({
      status: "failed",
      error_message: error.message,
      duration_ms: Date.now() - startTime,
      completed_at: new Date(),
    }).where(eq(agent_runs.id, runId));
  }
}
