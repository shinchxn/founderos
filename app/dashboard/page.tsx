import { db } from "../../lib/db";
import { kpis, deals, tasks, alerts, agent_hours_saved, agent_runs, workspaces } from "../../lib/db/schema";
import { eq, sum, and, notInArray, not, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Check, ArrowUpRight, ArrowDownRight, DollarSign, Globe, Users, Briefcase, Play, Mail, FileText, CheckCircle, ChevronRight, Activity } from "lucide-react";
import Link from "next/link";
import { ClientRefresher } from "./ClientRefresher";

export const dynamic = "force-dynamic";

function getTimeAgo(date: Date | null) {
  if (!date) return "Unknown";
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hrs ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " secs ago";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, userId)
  });
  
  if (!ws) {
    return <div className="p-6">No workspace found. Please log out and sign in again.</div>;
  }

  if (!ws.setup_completed) {
    redirect("/onboarding");
  }
  const workspaceId = ws.id;

  const kpiDataList = await db.query.kpis.findMany({
    where: eq(kpis.workspace_id, workspaceId),
    orderBy: (kpis, { desc }) => [desc(kpis.week_start)],
    limit: 2
  });
  const kpiData = kpiDataList[0] || null;
  const prevKpiData = kpiDataList[1] || null;

  const mrrTrend = (kpiData && prevKpiData && prevKpiData.mrr > 0) 
    ? ((kpiData.mrr - prevKpiData.mrr) / prevKpiData.mrr) * 100 
    : 0;

  const activeAlerts = await db.query.alerts.findMany({
    where: eq(alerts.workspace_id, workspaceId),
    orderBy: (alerts, { desc }) => [desc(alerts.created_at)],
    limit: 5
  });

  const activeDeals = await db.query.deals.findMany({
    where: and(
      eq(deals.workspace_id, workspaceId),
      notInArray(deals.stage, ['won', 'lost'])
    )
  });
  const activeDealsCount = activeDeals.length;

  const openTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.workspace_id, workspaceId),
      not(eq(tasks.status, 'done'))
    )
  });
  const openTasksCount = openTasks.length;

  const hoursSavedResult = await db.select({ total: sum(agent_hours_saved.estimated_minutes_saved) })
    .from(agent_hours_saved)
    .where(eq(agent_hours_saved.workspace_id, workspaceId));
  const totalMinutesSaved = Number(hoursSavedResult[0]?.total || 0);
  const totalHoursSaved = Math.round(totalMinutesSaved / 60);

  const hoursByAgent = await db.select({ agent_type: agent_hours_saved.agent_type, total: sum(agent_hours_saved.estimated_minutes_saved) })
    .from(agent_hours_saved)
    .where(eq(agent_hours_saved.workspace_id, workspaceId))
    .groupBy(agent_hours_saved.agent_type);

  const recentAgentRuns = await db.query.agent_runs.findMany({
    where: eq(agent_runs.workspace_id, workspaceId),
    orderBy: (agent_runs, { desc }) => [desc(agent_runs.created_at)],
    limit: 10
  });

  return (
    <>
      <ClientRefresher intervalMs={15000} />
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Dashboard</h2>
        <p className="text-sm text-muted">Good morning, {session.user.name?.split(' ')[0] || 'Founder'}. Startup Command Dashboard.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Column (Left 8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Stat Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111820] border border-[#1a2332] rounded-md p-4 card-hover">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">MRR</span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-mono text-primary">${kpiData?.mrr?.toLocaleString() || '0'}</span>
                <span className={`text-xs font-mono flex items-center ${mrrTrend >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {mrrTrend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />} 
                  {Math.abs(mrrTrend).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bg-[#111820] border border-[#1a2332] rounded-md p-4 card-hover">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">Active Deals</span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-mono text-primary">{activeDealsCount}</span>
                <span className="text-xs font-mono text-muted">-</span>
              </div>
            </div>
            <div className="bg-[#111820] border border-[#1a2332] rounded-md p-4 card-hover">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">Open Tasks</span>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-mono text-primary">{openTasksCount}</span>
                <span className="text-xs font-mono text-muted">-</span>
              </div>
            </div>
            <div className={`bg-[#111820] border-y border-r border-[#1a2332] border-l-2 rounded-md p-4 card-hover ${
              !kpiData?.runway_months ? 'border-l-[#1a2332]' : 
              kpiData.runway_months < 6 ? 'border-l-[#ef4444]' : 
              kpiData.runway_months < 12 ? 'border-l-[#f59e0b]' : 'border-l-[#10b981]'
            }`}>
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">Runway</span>
              <div className="flex items-end justify-between">
                <span className={`text-2xl font-mono ${
                  !kpiData?.runway_months ? 'text-primary' : 
                  kpiData.runway_months < 6 ? 'text-[#ef4444]' : 
                  kpiData.runway_months < 12 ? 'text-[#f59e0b]' : 'text-[#10b981]'
                }`}>
                  {kpiData?.runway_months || '0'}mo
                </span>
              </div>
            </div>
          </div>

          {/* Setup Progress */}
          <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-primary">Setup Progress</h3>
              <span className="text-sm text-muted">40% Completed</span>
            </div>
            <div className="flex items-center justify-between w-full relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-[#1a2332] z-0"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[40%] h-[2px] bg-[#0ea5e9] z-0"></div>
              
              <Link href="/dashboard/settings" className="flex flex-col items-center gap-2 z-10 bg-[#111820] px-2 text-center group">
                <div className="w-6 h-6 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-primary group-hover:text-[#0ea5e9] transition-colors">Bank</span>
              </Link>
              <Link href="/dashboard/crm" className="flex flex-col items-center gap-2 z-10 bg-[#111820] px-2 text-center group">
                <div className="w-6 h-6 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-primary group-hover:text-[#0ea5e9] transition-colors">CRM</span>
              </Link>
              <Link href="/dashboard/meetings" className="flex flex-col items-center gap-2 z-10 bg-[#111820] px-2 text-center group">
                <div className="w-6 h-6 rounded-full bg-[#1a2332] border border-[#0ea5e9] flex items-center justify-center relative group-hover:scale-110 transition-transform cursor-pointer">
                  <div className="absolute -inset-1.5 rounded-full bg-[#0ea5e9]/20 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-[#0ea5e9]"></div>
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#0ea5e9]">Notes</span>
              </Link>
              <Link href="/dashboard/settings" className="flex flex-col items-center gap-2 z-10 bg-[#111820] px-2 text-center group">
                <div className="w-6 h-6 rounded-full bg-[#1a2332] border border-[#272a30] text-muted text-xs font-bold flex items-center justify-center group-hover:border-[#0ea5e9] group-hover:text-[#0ea5e9] transition-colors cursor-pointer">
                  4
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-muted group-hover:text-primary transition-colors">Team</span>
              </Link>
              <Link href="/dashboard" className="flex flex-col items-center gap-2 z-10 bg-[#111820] px-2 text-center group">
                <div className="w-6 h-6 rounded-full bg-[#1a2332] border border-[#272a30] text-muted text-xs font-bold flex items-center justify-center group-hover:border-[#0ea5e9] group-hover:text-[#0ea5e9] transition-colors cursor-pointer">
                  5
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-muted group-hover:text-primary transition-colors">Live</span>
              </Link>
            </div>
          </div>

          {/* Hours Saved Banner */}
          <div className="bg-[#1a2332]/30 border border-[#8b5cf6]/30 rounded-md p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/10 to-transparent opacity-50 z-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#a78bfa] mb-1 block">Total Impact</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-mono text-primary">{totalHoursSaved}</span>
                  <span className="text-base text-muted">hrs saved</span>
                </div>
                <p className="text-sm text-muted mt-2 max-w-sm">AI Agents are actively automating your routine tasks.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hoursByAgent.map((agent) => (
                  <div key={agent.agent_type} className="bg-[#111820]/80 border border-[#1a2332] px-3 py-2 rounded">
                    <span className="block text-[11px] font-bold tracking-wider uppercase text-muted mb-1">{agent.agent_type}</span>
                    <span className="font-mono text-sm text-[#a78bfa]">{Math.round(Number(agent.total) / 60)} hrs</span>
                  </div>
                ))}
                {hoursByAgent.length === 0 && (
                  <div className="text-sm text-muted italic px-3 py-2">No agents active yet</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Side Column (Right 4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Agent Activity */}
          <div className="bg-[#111820] border border-[#1a2332] rounded-md flex flex-col h-[300px]">
            <div className="p-4 border-b border-[#1a2332] flex justify-between items-center bg-[#080b10]">
              <h3 className="text-[11px] font-bold tracking-wider uppercase text-primary">Agent Activity</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#10b981]">Live</span>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {recentAgentRuns.length === 0 ? (
                <div className="text-sm text-muted italic h-full flex items-center justify-center">No agent activity yet</div>
              ) : (
                recentAgentRuns.map((run, index) => (
                  <div key={run.id} className={`flex gap-3 items-start ${index > 2 ? 'opacity-70' : ''}`}>
                    <div className="w-6 h-6 rounded bg-[#0ea5e9]/20 text-[#0ea5e9] flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary"><span className="font-medium">{run.agent_type}</span> {run.output_summary || "processed a task."}</p>
                      <span className="text-xs text-muted">{getTimeAgo(run.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-[#111820] border border-[#1a2332] rounded-md flex flex-col">
            <div className="p-4 border-b border-[#1a2332] bg-[#080b10]">
              <h3 className="text-[11px] font-bold tracking-wider uppercase text-primary">Active Alerts</h3>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {activeAlerts.length === 0 && (
                 <div className="p-3 bg-[#080b10] text-muted text-sm italic text-center rounded">
                   No active alerts.
                 </div>
              )}
              {activeAlerts.map(alert => (
                 <div key={alert.id} className={`p-3 border-l-2 bg-[#080b10] hover:bg-[#1a2332]/50 transition-colors cursor-pointer rounded-r ${
                    alert.severity === 'high' ? 'border-l-[#ef4444]' : 
                    alert.severity === 'medium' ? 'border-l-[#f59e0b]' : 'border-l-[#0ea5e9]'
                 }`}>
                   <div className="flex justify-between items-start mb-1">
                     <span className={`text-[11px] font-bold tracking-wider uppercase ${
                        alert.severity === 'high' ? 'text-[#ef4444]' : 
                        alert.severity === 'medium' ? 'text-[#f59e0b]' : 'text-[#0ea5e9]'
                     }`}>{alert.severity === 'high' ? 'Critical' : alert.severity === 'medium' ? 'Warning' : 'Info'}</span>
                     <ChevronRight className="w-3.5 h-3.5 text-muted" />
                   </div>
                   <p className="text-sm text-primary">{alert.body || alert.title}</p>
                 </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

