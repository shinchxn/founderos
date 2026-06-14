import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

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

    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.workspace_id, ws.id),
      orderBy: [desc(tasks.created_at)],
    });

    return NextResponse.json(allTasks);
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

    const body = await req.json();
    const { title, description, status, priority, assignee_email, due_date, source, linked_entity_type, linked_entity_id } = body;

    if (!title || !status || !priority) {
      return NextResponse.json({ error: "Missing required fields: title, status, priority" }, { status: 400 });
    }

    const newTaskId = `task_${crypto.randomUUID()}`;
    const [inserted] = await db.insert(tasks).values({
      id: newTaskId,
      workspace_id: ws.id,
      title,
      description: description || null,
      status,
      priority,
      assignee_email: assignee_email || null,
      due_date: due_date ? new Date(due_date) : null,
      source: source || "manual",
      linked_entity_type: linked_entity_type || null,
      linked_entity_id: linked_entity_id || null,
    }).returning();

    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
