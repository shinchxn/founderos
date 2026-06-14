"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { kpis, deals, tasks, agent_hours_saved, agent_runs, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function generateDemoData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id)
  });

  if (!ws) {
    throw new Error("Workspace not found");
  }

  const workspaceId = ws.id;

  // Clear existing demo data to prevent stacking
  await db.delete(kpis).where(eq(kpis.workspace_id, workspaceId));
  await db.delete(deals).where(eq(deals.workspace_id, workspaceId));
  await db.delete(tasks).where(eq(tasks.workspace_id, workspaceId));
  await db.delete(agent_hours_saved).where(eq(agent_hours_saved.workspace_id, workspaceId));
  await db.delete(agent_runs).where(eq(agent_runs.workspace_id, workspaceId));

  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Seed KPIs
  await db.insert(kpis).values([
    {
      id: `kpi_${Date.now()}_1`,
      workspace_id: workspaceId,
      week_start: lastWeek,
      mrr: 38500,
      arr: 462000,
      new_signups: 110,
      churn_count: 5,
      active_users: 1200,
      runway_months: 15,
    },
    {
      id: `kpi_${Date.now()}_2`,
      workspace_id: workspaceId,
      week_start: now,
      mrr: 42500,
      arr: 510000,
      new_signups: 145,
      churn_count: 3,
      active_users: 1350,
      runway_months: 14,
    }
  ]);

  // 2. Seed Deals
  await db.insert(deals).values([
    { id: `deal_${Date.now()}_1`, workspace_id: workspaceId, title: "Acme Corp Enterprise License", value: 120000, stage: "negotiation", probability: 80 },
    { id: `deal_${Date.now()}_2`, workspace_id: workspaceId, title: "TechFlow API Integration", value: 45000, stage: "proposal", probability: 60 },
    { id: `deal_${Date.now()}_3`, workspace_id: workspaceId, title: "GlobalNet SaaS Expansion", value: 85000, stage: "qualified", probability: 40 },
    { id: `deal_${Date.now()}_4`, workspace_id: workspaceId, title: "Stark Industries Pilot", value: 25000, stage: "lead", probability: 20 },
    { id: `deal_${Date.now()}_5`, workspace_id: workspaceId, title: "Wayne Enterprises Bundle", value: 150000, stage: "won", probability: 100 },
  ]);

  // 3. Seed Tasks
  await db.insert(tasks).values([
    { id: `task_${Date.now()}_1`, workspace_id: workspaceId, title: "Review Q3 Marketing Budget", status: "todo", priority: "high", source: "manual" },
    { id: `task_${Date.now()}_2`, workspace_id: workspaceId, title: "Follow up with Acme Corp", status: "in_progress", priority: "medium", source: "agent" },
    { id: `task_${Date.now()}_3`, workspace_id: workspaceId, title: "Draft Investor Update", status: "todo", priority: "medium", source: "agent" },
  ]);

  // 4. Seed Agent Hours Saved
  await db.insert(agent_hours_saved).values([
    { id: `hrs_${Date.now()}_1`, workspace_id: workspaceId, agent_type: "Sales Agent", action_description: "Drafted 50 follow-up emails", estimated_minutes_saved: 2880 }, // 48 hours
    { id: `hrs_${Date.now()}_2`, workspace_id: workspaceId, agent_type: "Support Agent", action_description: "Resolved 200 tier 1 tickets", estimated_minutes_saved: 3120 }, // 52 hours
    { id: `hrs_${Date.now()}_3`, workspace_id: workspaceId, agent_type: "Research Agent", action_description: "Competitor analysis report", estimated_minutes_saved: 1440 }, // 24 hours
  ]);

  // 5. Seed Agent Runs
  await db.insert(agent_runs).values([
    { id: `run_${Date.now()}_1`, workspace_id: workspaceId, agent_type: "Sales Agent", status: "completed", output_summary: "drafted 14 follow-up emails.", created_at: new Date(now.getTime() - 2 * 60 * 1000) },
    { id: `run_${Date.now()}_2`, workspace_id: workspaceId, agent_type: "Research Agent", status: "completed", output_summary: "completed Q3 Competitor Analysis.", created_at: new Date(now.getTime() - 15 * 60 * 1000) },
    { id: `run_${Date.now()}_3`, workspace_id: workspaceId, agent_type: "Support Agent", status: "completed", output_summary: "resolved ticket #4092.", created_at: new Date(now.getTime() - 60 * 60 * 1000) },
    { id: `run_${Date.now()}_4`, workspace_id: workspaceId, agent_type: "Data Agent", status: "completed", output_summary: "synced Stripe revenue data.", created_at: new Date(now.getTime() - 120 * 60 * 1000) },
  ]);

  revalidatePath("/dashboard");
}
