"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const companyName = formData.get("companyName") as string;
  const industry = formData.get("industry") as string;
  const stage = formData.get("stage") as string;

  if (!companyName || !industry || !stage) {
    throw new Error("Missing required fields");
  }

  await db.update(workspaces)
    .set({
      name: companyName,
      industry,
      stage,
      setup_completed: true,
      updated_at: new Date(),
    })
    .where(eq(workspaces.owner_id, session.user.id));

  redirect("/dashboard");
}
