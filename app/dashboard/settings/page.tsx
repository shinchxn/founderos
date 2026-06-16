import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workspaces, workspace_integrations } from "@/lib/db/schema";
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

  const stripeIntegration = await db.query.workspace_integrations.findFirst({
    where: (wi, { and, eq }) => and(
      eq(wi.workspace_id, ws.id),
      eq(wi.provider, "stripe_connect")
    )
  });
  const isStripeConnected = stripeIntegration?.status === "active";

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

      <div className="bg-[#111820] border border-[#1a2332] rounded-md max-w-3xl mt-6">
         <div className="px-6 py-5 border-b border-[#1a2332]">
           <h3 className="font-semibold text-primary">Integrations</h3>
           <p className="text-sm text-muted mt-1">Connect external services to automate data collection.</p>
         </div>
         <div className="px-6 py-5">
           <div className="flex items-center justify-between">
             <div>
               <h4 className="font-medium text-primary">Stripe (Read-only)</h4>
               <p className="text-sm text-muted">Auto-sync MRR, signups, and churn every week.</p>
             </div>
             {isStripeConnected ? (
               <span className="inline-flex items-center rounded-md bg-[#10b981]/10 px-2 py-1 text-xs font-medium text-[#10b981] ring-1 ring-inset ring-[#10b981]/20">Connected</span>
             ) : (
               <a href="/api/integrations/stripe-connect" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-100 transition-colors">Connect Stripe</a>
             )}
           </div>
         </div>
      </div>
    </div>
  );
}
