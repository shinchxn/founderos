import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id)
  });

  if (!ws) redirect("/login");

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="mb-8 shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Settings</h2>
        <p className="text-sm text-muted">Manage your workspace preferences, core models and billing configurations.</p>
      </div>

      <div className="bg-[#111820] border border-[#1a2332] rounded-md max-w-3xl">
         <div className="px-6 py-5 border-b border-[#1a2332]">
           <h3 className="font-semibold text-primary">Workspace Profile</h3>
         </div>
         <SettingsForm initialName={ws.name} initialEmail={ws.investor_email || ""} />
      </div>
    </div>
  );
}
