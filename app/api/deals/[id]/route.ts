import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deals, workspaces } from "@/lib/db/schema";
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
    const { title, value, stage, probability, notes, expected_close_date } = body;

    const [updated] = await db.update(deals).set({
      ...(title !== undefined && { title }),
      ...(value !== undefined && { value: parseInt(value, 10) || 0 }),
      ...(stage !== undefined && { stage }),
      ...(probability !== undefined && { probability: parseInt(probability, 10) || 0 }),
      ...(notes !== undefined && { notes }),
      ...(expected_close_date !== undefined && { expected_close_date: expected_close_date ? new Date(expected_close_date) : null }),
      updated_at: new Date(),
    }).where(
      and(
        eq(deals.id, id),
        eq(deals.workspace_id, ws.id)
      )
    ).returning();

    if (!updated) {
      return NextResponse.json({ error: "Deal not found or unauthorized" }, { status: 404 });
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
    const [deleted] = await db.delete(deals)
      .where(
        and(
          eq(deals.id, id),
          eq(deals.workspace_id, ws.id)
        )
      ).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
