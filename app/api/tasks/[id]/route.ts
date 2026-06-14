import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await req.json();
    const { title, description, status, priority, assignee_email, due_date, completed } = body;

    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assignee_email !== undefined && { assignee_email }),
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
      updated_at: new Date(),
    };

    if (status === "done" || completed === true) {
      updateData.completed_at = new Date();
      updateData.status = "done";
    } else if (status !== undefined && status !== "done") {
      updateData.completed_at = null;
    }

    const [updated] = await db.update(tasks).set(updateData).where(
      and(
        eq(tasks.id, id),
        eq(tasks.workspace_id, ws.id)
      )
    ).returning();

    if (!updated) {
      return NextResponse.json({ error: "Task not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const [deleted] = await db.delete(tasks)
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.workspace_id, ws.id)
        )
      ).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
