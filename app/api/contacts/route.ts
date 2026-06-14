import { auth } from "@/auth";
import { db } from "@/lib/db";
import { contacts, workspaces } from "@/lib/db/schema";
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

    const allContacts = await db.query.contacts.findMany({
      where: eq(contacts.workspace_id, ws.id),
      orderBy: [desc(contacts.created_at)],
    });

    return NextResponse.json(allContacts);
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
    const { name, email, company, title, phone, notes, tags } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const newContactId = `contact_${crypto.randomUUID()}`;
    const [inserted] = await db.insert(contacts).values({
      id: newContactId,
      workspace_id: ws.id,
      name,
      email: email || null,
      company: company || null,
      title: title || null,
      phone: phone || null,
      notes: notes || null,
      tags: tags || [],
    }).returning();

    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
