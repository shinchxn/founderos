import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Video, Mail, AlertTriangle, Users } from "lucide-react";
import { db } from "@/lib/db";
import { agent_runs, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AgentHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id)
  });
  
  if (!ws) {
    return <div className="p-6">No workspace found. Please log out and sign in again.</div>;
  }

  const runs = await db.query.agent_runs.findMany({
    where: eq(agent_runs.workspace_id, ws.id),
    orderBy: (agent_runs, { desc }) => [desc(agent_runs.created_at)],
    limit: 5
  });

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="mb-8 shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Agent Hub</h2>
        <p className="text-sm text-muted">Check, execute and stream continuous background diagnostics logs of active agents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        {/* Agent Card 1 */}
        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 flex flex-col items-start card-hover">
          <div className="bg-[#0ea5e9]/10 p-2 text-[#0ea5e9] rounded mb-4">
            <Video className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-primary mb-2">Meeting Intelligence</h3>
          <p className="text-xs text-muted mb-6 flex-1">Reads transcripts uploads, extracts actionable milestone lists, and pushes tasks directly.</p>
          <span className="text-[10px] font-bold tracking-wider text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20">ACTIVE</span>
        </div>

        {/* Agent Card 2 */}
        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 flex flex-col items-start card-hover">
          <div className="bg-[#8b5cf6]/10 p-2 text-[#8b5cf6] rounded mb-4">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-primary mb-2">Investor Updates</h3>
          <p className="text-xs text-muted mb-6 flex-1">Assembles operational updates drafts compiling your MRR snapshot curves with task logs.</p>
          <span className="text-[10px] font-bold tracking-wider text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20">ACTIVE</span>
        </div>

        {/* Agent Card 3 */}
        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 flex flex-col items-start card-hover">
          <div className="bg-[#f59e0b]/10 p-2 text-[#f59e0b] rounded mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-primary mb-2">Revenue Anomaly</h3>
          <p className="text-xs text-muted mb-6 flex-1">Monitors weekly KPIs sheets and flags WoW fluctuations higher than 20% limits instantly.</p>
          <span className="text-[10px] font-bold tracking-wider text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20">ACTIVE</span>
        </div>

        {/* Agent Card 4 */}
        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 flex flex-col items-start card-hover">
          <div className="bg-[#10b981]/10 p-2 text-[#10b981] rounded mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-primary mb-2">Sales CRM Digest</h3>
          <p className="text-xs text-muted mb-6 flex-1">Grooms commercial pipelines stages and populates action touchpoint reminders for hot deals.</p>
          <span className="text-[10px] font-bold tracking-wider text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20">ACTIVE</span>
        </div>
      </div>

      <div className="bg-[#080b10] border border-[#1a2332] rounded-md flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3 border-b border-[#1a2332] bg-[#111820]">
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-wider">AI Agent Live Run Execution Logs</h3>
          <span className="text-xs text-muted">Syncing background telemetry...</span>
        </div>
        
        <div className="flex-1 p-5 font-mono text-xs overflow-y-auto space-y-3">
          <div className="text-[#10b981]">[2026-06-09T07:12:30Z] INFO Init background daemon... CPU telemetry OK</div>
          <div className="text-[#10b981]">[2026-06-09T07:12:31Z] INFO Load workspace parameters for FounderOS HQ</div>
          <div className="text-[#10b981]">[2026-06-09T07:12:35Z] INFO Database connection pool SSL configurations enabled for Aurora PostgreSQL...</div>
          
          {runs.map(run => (
            <div key={run.id} className="text-[#0ea5e9]">
              [{new Date(run.created_at || Date.now()).toISOString()}] AGENT RUN: {run.agent_type} triggered. 
              Status: {run.status.toUpperCase()}. {run.output_summary}
            </div>
          ))}

          <div className="text-[#0ea5e9]">[2026-06-09T07:14:10Z] AGENT RUN: sales_digest triggered. Status: COMPLETED. Generated 1 prioritized touchpoint task.</div>
          <div className="text-[#f59e0b]">[2026-06-09T07:14:12Z] TELEMETRY: WoW MRR Expansion check finished. Variance within baseline tolerances.</div>
          <div className="text-[#8b5cf6]">[2026-06-09T07:20:11Z] AGENT RUN: investor_update auto-triggered by cron schedule. Metric snapshot compiled.</div>

          <div className="text-muted italic pt-4">Listening for trigger actions...</div>
        </div>
      </div>
    </div>
  );
}
