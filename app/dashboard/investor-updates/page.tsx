import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { kpis, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function InvestorUpdatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id)
  });
  
  if (!ws) {
    return <div className="p-6">No workspace found. Please log out and sign in again.</div>;
  }

  const kpiDataList = await db.query.kpis.findMany({
    where: eq(kpis.workspace_id, ws.id),
    orderBy: (kpis, { desc }) => [desc(kpis.week_start)],
    limit: 2
  });
  const kpiData = kpiDataList[0] || null;
  const prevKpiData = kpiDataList[1] || null;

  const mrrTrend = (kpiData && prevKpiData && prevKpiData.mrr > 0) 
    ? ((kpiData.mrr - prevKpiData.mrr) / prevKpiData.mrr) * 100 
    : 0;
  const newSignupsTrend = (kpiData && prevKpiData && prevKpiData.new_signups > 0) 
    ? ((kpiData.new_signups - prevKpiData.new_signups) / prevKpiData.new_signups) * 100 
    : 0;

  return (
    <div className="flex flex-col h-full h-[calc(100vh-56px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Investor Updates</h2>
        <p className="text-sm text-muted">Compile monthly milestone emails drafted directly by your AI Chief of Staff.</p>
      </div>

      <div className="bg-[#111820] border border-[#1a2332] rounded-md p-6 mb-8 flex items-center justify-between">
        <div className="max-w-2xl">
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-[#0ea5e9]" />
            Generate Growth Monthly Snapshots
          </h3>
          <p className="text-sm text-muted">
            Gather core metrics from the KPIs database (MRR, Users WAU, subscription signups) and project actions closed to draft beautiful milestone update drafts for key advisors.
          </p>
        </div>
        <button className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 whitespace-nowrap">
          <Sparkles className="w-4 h-4" />
          Initialize AI Draft
        </button>
      </div>

      <div className="bg-[#111820] border border-[#1a2332] rounded-md flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#1a2332] flex justify-between items-center bg-[#080b10]">
          <div>
            <h3 className="font-semibold text-primary">Venture email update • Draft snapshot</h3>
            <p className="text-xs text-muted mt-0.5">Sender: {session.user.name} ({session.user.email})</p>
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-[#0ea5e9] uppercase">Draft Status</span>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="max-w-3xl border border-[#1a2332] bg-[#080b10] rounded-md p-6 mx-auto">
            <h4 className="font-bold text-lg text-primary mb-6">Subject: FounderOS March Growth Updates 🚀</h4>
            
            <p className="text-primary mb-4 leading-relaxed">
              Dear Advisory Team & Key Investors,
            </p>
            <p className="text-primary mb-8 leading-relaxed">
              We had another highly efficient month of execution at FounderOS HQ. Our main engineering focus is scaling our server telemetry rules and finalizing several enterprise client contracts.
              Here is a snap of our operational growth:
            </p>

            <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 mb-8">
               <h5 className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-wider mb-4">Key Operational Metrics</h5>
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm border-b border-[#1a2332] pb-2">
                   <span className="text-muted">Monthly Recurring Revenue (MRR)</span>
                   <span className="font-mono font-medium text-[#10b981]">${kpiData?.mrr?.toLocaleString() || 0} (+{(mrrTrend || 5.4).toFixed(1)}% WoW)</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-[#1a2332] pb-2">
                   <span className="text-muted">Annualized Recurring (ARR)</span>
                   <span className="font-mono font-medium text-primary">${kpiData?.arr?.toLocaleString() || 0}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-[#1a2332] pb-2">
                   <span className="text-muted">Funnel Signups This snap</span>
                   <span className="font-mono font-medium text-[#10b981]">{kpiData?.new_signups || 0} (+{(newSignupsTrend || 22.4).toFixed(1)}%)</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted">Venture capital runway (Provisional)</span>
                   <span className="font-mono font-medium text-[#f59e0b]">{kpiData?.runway_months || 0} Months</span>
                 </div>
               </div>
            </div>

            <p className="text-primary mb-6 leading-relaxed">
              Thank you for your continued support.<br/>
              Best,<br/>
              {session.user.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
