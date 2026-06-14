import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tasks, workspaces } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TaskBoard } from "./task-board";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get workspace
  const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.owner_id, session.user.id)).limit(1);
  const workspace = userWorkspaces[0];
  if (!workspace) redirect("/setup");

  const workspaceTasks = await db.select().from(tasks)
    .where(eq(tasks.workspace_id, workspace.id))
    .orderBy(desc(tasks.created_at));

  const activeTasks = workspaceTasks.filter(t => t.status !== 'done');
  const completedTasks = workspaceTasks.filter(t => t.status === 'done');

  return (
    <div className="flex flex-col h-full h-[calc(100vh-56px)]">
      <div className="flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Tasks</h2>
          <p className="text-sm text-muted">Continuous roadmap tasks and automated triggers catalogued by AI Agents.</p>
        </div>
        <div className="w-64">
           <input 
             type="text" 
             placeholder="Search Tasks..." 
             className="w-full bg-[#111820] border border-[#1a2332] rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
           />
        </div>
      </div>

      <TaskBoard activeTasks={activeTasks} completedTasks={completedTasks} />
    </div>
  );
}
