import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { deals, contacts, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CRMExplorer } from "./CRMExplorer";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id),
  });

  if (!ws) {
    return <div className="p-6 text-muted">Workspace not found. Please log in again.</div>;
  }

  const workspaceDeals = await db.query.deals.findMany({
    where: eq(deals.workspace_id, ws.id),
    orderBy: [desc(deals.created_at)],
  });

  const workspaceContacts = await db.query.contacts.findMany({
    where: eq(contacts.workspace_id, ws.id),
    orderBy: [desc(contacts.created_at)],
  });

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)]">
      {/* Workspace Header Segment */}
      <div className="pb-2 border-b border-[#1a2332] bg-[#080b10] shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded">
            CRM
          </span>
          <span className="text-sm text-muted">/</span>
          <span className="text-[11px] font-bold tracking-wider uppercase text-muted font-mono">
            {ws.name || ws.slug}
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Founder CRM</h2>
        <p className="text-sm text-muted mt-0.5">
          Track high-value fundraise opportunities, commercial client conversations, and pipeline milestones.
        </p>
      </div>

      {/* Interactive CRM Hub */}
      <CRMExplorer 
        initialDeals={workspaceDeals} 
        initialContacts={workspaceContacts} 
      />
    </div>
  );
}
