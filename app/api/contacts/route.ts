import { auth } from "@/auth";
import { db } from "@/lib/db";
import { contacts, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createInsertSchema } from "drizzle-zod";

const insertContactSchema = createInsertSchema(contacts).omit({ id: true, workspace_id: true, created_at: true, updated_at: true, last_contacted_at: true });

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

    const rawBody = await req.json();
    const body = insertContactSchema.safeParse(rawBody);

    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { name, email, company, title, phone, notes, tags } = body.data;

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
