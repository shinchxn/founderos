import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { kpis, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { KPIActions } from "./KPIActions";
import { KPIChart } from "./KPIChart";

export const dynamic = "force-dynamic";

export default async function KPIsPage() {
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
    limit: 12
  });

  const currentKpi = kpiDataList[0];
  const previousKpi = kpiDataList[1];

  const mrr = currentKpi?.mrr || 0;
  const mrrTrend = (mrr && previousKpi?.mrr) ? ((mrr - previousKpi.mrr) / previousKpi.mrr) * 100 : 0;

  // Estimated expenses based on MRR
  const estExpenses = mrr ? mrr * 1.2 : 0;
  const burnTrend = (estExpenses && previousKpi?.mrr) ? (((mrr * 1.2) - (previousKpi.mrr * 1.2)) / (previousKpi.mrr * 1.2)) * 100 : 0;

  const hasData = kpiDataList.length > 0;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Financial KPIs</h2>
        <p className="text-sm text-muted">Real-time telemetry for core business metrics.</p>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* MRR Card */}
        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-4 hover:bg-[#1a2332]/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-muted">MRR</span>
            {hasData && (
              <div className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium ${mrrTrend >= 0 ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                {mrrTrend >= 0 ? '+' : ''}{mrrTrend.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-2xl font-mono font-medium text-primary mb-4">${mrr.toLocaleString()}</div>
          <div className="h-8 w-full flex items-end">
             {hasData ? (
               <div className="w-full h-full border-b-2 border-[#0ea5e9]/50"></div>
             ) : (
               <span className="text-xs text-muted">No historical data</span>
             )}
          </div>
        </div>

        {/* CAC Card */}
        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-4 hover:bg-[#1a2332]/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-muted">Signups</span>
            {hasData && currentKpi && previousKpi && (
               <div className="bg-[#8b5cf6]/10 text-[#8b5cf6] px-2 py-0.5 rounded font-mono text-[11px] font-medium">
                 {currentKpi.new_signups >= previousKpi.new_signups ? '+' : ''}
                 {(((currentKpi.new_signups - previousKpi.new_signups) / Math.max(previousKpi.new_signups, 1)) * 100).toFixed(1)}%
               </div>
            )}
          </div>
          <div className="text-2xl font-mono font-medium text-primary mb-4">{currentKpi?.new_signups || 0}</div>
          <div className="h-8 w-full flex items-end">
             {hasData ? (
               <div className="w-full h-full border-b-2 border-[#8b5cf6]/50"></div>
             ) : (
               <span className="text-xs text-muted">No historical data</span>
             )}
          </div>
        </div>

        {/* Estimated Expenses Card */}
        <div className={`bg-[#111820] border ${hasData && estExpenses > mrr ? 'border-[#ef4444]/30' : 'border-[#1a2332]'} rounded-md p-4 hover:bg-[#1a2332]/50 transition-colors relative overflow-hidden`}>
          {hasData && estExpenses > mrr && <div className="absolute inset-0 bg-gradient-to-t from-[#ef4444]/10 to-transparent pointer-events-none"></div>}
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-[11px] font-bold tracking-wider uppercase text-muted flex items-center gap-1" title="~MRR × 1.2">
              Est. Expenses
            </span>
            {hasData && (
              <div className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium ${burnTrend <= 0 ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                {burnTrend > 0 ? '+' : ''}{burnTrend.toFixed(1)}%
              </div>
            )}
          </div>
          <div className={`text-2xl font-mono font-medium ${hasData && estExpenses > mrr ? 'text-[#ef4444]' : 'text-primary'} mb-4 relative z-10`}>${estExpenses.toLocaleString()}</div>
          <div className="h-8 w-full relative z-10 flex items-end">
             {hasData ? (
               <div className="w-full h-full border-b-2 border-[#ef4444]/50"></div>
             ) : (
               <span className="text-xs text-muted">No historical data</span>
             )}
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-[#111820] border border-[#1a2332] rounded-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-primary">SaaS Revenue & Signup Trends</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#0ea5e9]/20 border border-[#0ea5e9]"></div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-muted">MRR</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#8b5cf6]"></div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-muted">Signups</span>
            </div>
          </div>
        </div>
        
        {/* Dynamic Chart Area */}
        <div className="h-64 w-full relative border-l border-b border-[#1a2332] flex items-end justify-center">
          <KPIChart kpiDataList={kpiDataList} />
        </div>
      </div>

      <div className="bg-[#111820] border border-[#1a2332] rounded-md flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1a2332] flex justify-between items-center bg-[#080b10]">
          <h3 className="font-semibold text-primary">KPI History Log</h3>
          <KPIActions kpiDataList={kpiDataList} />
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1a2332] bg-[#111820]/50">
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider w-32">Week</th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">MRR</th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Signups</th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider text-right">Est. Expenses</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono font-medium">
              {!hasData ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted font-sans font-normal border-t border-[#1a2332] italic">
                    No historical data available.
                  </td>
                </tr>
              ) : (
                kpiDataList.map((row) => (
                  <tr key={row.id} className="border-b border-[#1a2332] hover:bg-[#1a2332]/30 transition-colors">
                    <td className="px-5 py-3 text-muted">
                      {new Date(row.week_start).toLocaleDateString()}
                      {row.stripe_synced && (
                        <span className="ml-2 inline-flex items-center rounded bg-[#8b5cf6]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#8b5cf6] ring-1 ring-inset ring-[#8b5cf6]/20">Stripe</span>
                      )}
                    </td>
                    <td className="px-5 py-3">${row.mrr.toLocaleString()}</td>
                    <td className="px-5 py-3">{row.new_signups}</td>
                    <td className="px-5 py-3 text-right text-[#ef4444]">${Math.round(row.mrr * 1.2).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
