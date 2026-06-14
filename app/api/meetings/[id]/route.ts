import { auth } from "@/auth";
import { db } from "@/lib/db";
import { meetings, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, id),
        eq(meetings.workspace_id, ws.id)
      ),
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { title, raw_notes, processed } = body;

    const [updated] = await db.update(meetings).set({
      ...(title !== undefined && { title }),
      ...(raw_notes !== undefined && { raw_notes }),
      ...(processed !== undefined && { processed }),
      updated_at: new Date(),
    }).where(
      and(
        eq(meetings.id, id),
        eq(meetings.workspace_id, ws.id)
      )
    ).returning();

    if (!updated) {
      return NextResponse.json({ error: "Meeting not found or unauthorized" }, { status: 404 });
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
    const [deleted] = await db.delete(meetings).where(
      and(
        eq(meetings.id, id),
        eq(meetings.workspace_id, ws.id)
      )
    ).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
