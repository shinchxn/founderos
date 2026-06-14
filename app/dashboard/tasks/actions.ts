"use server";

import { db } from "@/lib/db";
import { tasks, workspaces } from "@/lib/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string || "medium";

  if (!title) return { error: "Title is required" };

  // Find user workspace
  const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.owner_id, session.user.id)).limit(1);
  const workspace = userWorkspaces[0];
  if (!workspace) return { error: "Workspace not found" };

  await db.insert(tasks).values({
    id: `tsk_${Date.now()}`,
    workspace_id: workspace.id,
    title,
    description,
    status: "todo",
    priority,
    source: "manual",
  });

  revalidatePath("/dashboard/tasks");
  return { success: true };
}

export async function completeTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.update(tasks).set({ 
    status: "done", 
    completed_at: new Date() 
  }).where(eq(tasks.id, taskId));

  revalidatePath("/dashboard/tasks");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.delete(tasks).where(eq(tasks.id, taskId));

  revalidatePath("/dashboard/tasks");
  return { success: true };
}
