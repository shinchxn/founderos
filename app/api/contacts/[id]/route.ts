import { auth } from "@/auth";
import { db } from "@/lib/db";
import { contacts, workspaces } from "@/lib/db/schema";
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
    const { name, email, company, title, phone, notes, tags } = body;

    const [updated] = await db.update(contacts).set({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(company !== undefined && { company }),
      ...(title !== undefined && { title }),
      ...(phone !== undefined && { phone }),
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags }),
      updated_at: new Date(),
    }).where(
      and(
        eq(contacts.id, id),
        eq(contacts.workspace_id, ws.id)
      )
    ).returning();

    if (!updated) {
      return NextResponse.json({ error: "Contact not found or unauthorized" }, { status: 404 });
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
    const [deleted] = await db.delete(contacts)
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.workspace_id, ws.id)
        )
      ).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
