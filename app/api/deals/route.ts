import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deals, workspaces } from "@/lib/db/schema";
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

    const allDeals = await db.query.deals.findMany({
      where: eq(deals.workspace_id, ws.id),
      orderBy: [desc(deals.created_at)],
    });

    return NextResponse.json(allDeals);
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
    const { title, value, stage, probability, notes, contact_id, expected_close_date } = body;

    if (!title || value === undefined || !stage) {
      return NextResponse.json({ error: "Missing required fields: title, value, stage" }, { status: 400 });
    }

    const newDealId = `deal_${crypto.randomUUID()}`;
    const [inserted] = await db.insert(deals).values({
      id: newDealId,
      workspace_id: ws.id,
      contact_id: contact_id || null,
      title,
      value: parseInt(value, 10) || 0,
      stage,
      probability: parseInt(probability, 10) || 0,
      notes: notes || null,
      expected_close_date: expected_close_date ? new Date(expected_close_date) : null,
      priority_score: 0,
    }).returning();

    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
