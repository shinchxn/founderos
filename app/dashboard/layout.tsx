import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, CheckSquare, LineChart, Video, Mail, Bot, Settings, Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Toaster } from "sonner";
import { workspaces, kpis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import { redirect } from "next/navigation";
import { generateDemoData } from "@/app/actions/seed";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id)
  });

  const workspaceName = ws?.name || "My Startup";
  const plan = ws?.plan || "free";
  const userName = session.user.name || "Founder";
  const userInitials = userName.substring(0, 2).toUpperCase();
  const userImage = session.user.image;

  let agentRevenue = 0;
  if (ws) {
    const kpiData = await db.query.kpis.findFirst({
      where: eq(kpis.workspace_id, ws.id),
      orderBy: (kpis, { desc }) => [desc(kpis.week_start)],
    });
    agentRevenue = kpiData?.arr ? Math.round(kpiData.arr / 12) : 0;
  }

  return (
    <div className="flex min-h-screen bg-background text-primary">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#111820] border-r border-[#1a2332] flex flex-col py-4 z-50">
        <div className="px-4 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#0ea5e9]/10 rounded flex items-center justify-center text-[#0ea5e9] font-bold shrink-0">
              {workspaceName.substring(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-primary leading-tight text-lg truncate">{workspaceName}</h1>
              <span className="text-[11px] font-semibold tracking-wider text-muted uppercase truncate">{plan} Tier</span>
            </div>
          </div>
          <button className="w-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-sm rounded h-8 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            New Agent
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 mb-2 mt-4">Operations</div>
          <Link href="/dashboard" className="flex items-center gap-3 text-primary font-medium bg-[#1a2332] px-3 py-2 rounded-md transition-colors">
            <LayoutDashboard className="w-[18px] h-[18px] text-[#0ea5e9]" />
            Dashboard
          </Link>
          <Link href="/dashboard/crm" className="flex items-center gap-3 text-muted hover:text-primary px-3 py-2 rounded-md hover:bg-[#1a2332]/50 transition-colors">
            <Users className="w-[18px] h-[18px]" />
            CRM
          </Link>
          <Link href="/dashboard/tasks" className="flex items-center gap-3 text-muted hover:text-primary px-3 py-2 rounded-md hover:bg-[#1a2332]/50 transition-colors">
            <CheckSquare className="w-[18px] h-[18px]" />
            Tasks
          </Link>
          <Link href="/dashboard/kpis" className="flex items-center gap-3 text-muted hover:text-primary px-3 py-2 rounded-md hover:bg-[#1a2332]/50 transition-colors">
            <LineChart className="w-[18px] h-[18px]" />
            Financial KPIs
          </Link>
          <Link href="/dashboard/meetings" className="flex items-center gap-3 text-muted hover:text-primary px-3 py-2 rounded-md hover:bg-[#1a2332]/50 transition-colors">
            <Video className="w-[18px] h-[18px]" />
            Meetings
          </Link>

          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 mb-2 mt-6">AI Co-Pilot</div>
          <Link href="/dashboard/investor-updates" className="flex items-center gap-3 text-muted hover:text-primary px-3 py-2 rounded-md hover:bg-[#1a2332]/50 transition-colors">
            <Mail className="w-[18px] h-[18px]" />
            Investor Updates
          </Link>
          <Link href="/dashboard/agents" className="flex items-center gap-3 text-muted hover:text-primary px-3 py-2 rounded-md hover:bg-[#1a2332]/50 transition-colors">
            <Bot className="w-[18px] h-[18px]" />
            Agent Hub
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 text-muted hover:text-primary px-3 py-2 rounded-md hover:bg-[#1a2332]/50 transition-colors">
            <Settings className="w-[18px] h-[18px]" />
            Settings
          </Link>
        </nav>

        <div className="px-4 mt-auto pt-4 border-t border-[#1a2332]">
          <div className="bg-[#1a2332]/50 border border-[#1a2332] p-3 rounded-md mb-4 flex justify-between items-center">
            <div>
              <div className="text-[11px] font-bold text-[#0ea5e9] uppercase tracking-wider mb-1">{plan} Plan</div>
              <div className="text-xs text-muted">Automated agents enabled</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              {userImage ? (
                <Image src={userImage} alt={userName} width={32} height={32} className="rounded-full shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#272a30] text-muted flex items-center justify-center font-semibold text-xs shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="font-medium truncate pr-2">{userName}</div>
                <div className="text-xs text-muted truncate pr-2">{session.user.email}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-[220px] flex flex-col min-w-0">
        <header className="h-14 flex justify-between items-center px-6 border-b border-[#1a2332] bg-[#080b10] sticky top-0 z-40">
          <div className="flex items-center text-sm text-muted">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-[#10b981]">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div> SERVER
              </span>
              <span>ENGINE</span>
              <span>SECURE</span>
              <span>LIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <form action={generateDemoData}>
              <button type="submit" className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider border border-[#1a2332] px-3 py-1.5 rounded bg-[#111820] hover:text-[#0ea5e9] hover:border-[#0ea5e9]/50 transition-colors cursor-pointer">
                GENERATE DEMO DATA
              </button>
            </form>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider border-l border-[#1a2332] pl-4">
              AGENT REVENUE: <span className="text-[#10b981] font-mono">${agentRevenue.toLocaleString()} WAU</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster theme="dark" />
    </div>
  );
}
