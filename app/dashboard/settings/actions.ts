"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateWorkspaceSettings(name: string, investorEmail: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.update(workspaces)
    .set({ name, investor_email: investorEmail || null })
    .where(eq(workspaces.owner_id, session.user.id));

  revalidatePath("/dashboard/settings");
  return { success: true };
}
