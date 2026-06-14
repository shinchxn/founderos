"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Zap, LayoutDashboard, Handshake, CalendarDays,
  TrendingUp, Users, Bot, FileText, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "Pipeline", icon: Handshake },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/agents", label: "AI Agents", icon: Bot },
  { href: "/digest", label: "Digest", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 border-r border-[#1F2330] bg-[#111318] z-30 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1F2330] h-16">
        <div className="h-8 w-8 rounded-lg bg-[#6C63FF] flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white fill-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-[#F0F2FA]">FounderOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group",
                active
                  ? "bg-[#6C63FF]/10 text-[#6C63FF]"
                  : "text-[#8B93A9] hover:bg-[#191C23] hover:text-[#F0F2FA]"
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom info & profile */}
      <div className="p-4 border-t border-[#1F2330] space-y-4">
        {/* Settings & sign out links */}
        <div className="space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
              pathname === "/settings"
                ? "bg-[#6C63FF]/10 text-[#6C63FF]"
                : "text-[#8B93A9] hover:bg-[#191C23] hover:text-[#F0F2FA]"
            )}
          >
            <Settings size={14} />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[#8B93A9] hover:bg-[#191C23] hover:text-[#F0F2FA] transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>

        {/* Usage Card */}
        <div className="p-3 rounded-xl bg-[#191C23] border border-[#1F2330]">
          <div className="flex justify-between items-center mb-1.5 animate-pulse">
            <span className="text-[10px] uppercase tracking-wider text-[#4A5168] font-bold">Plan Usage</span>
            <span className="text-[10px] text-[#6C63FF] font-bold">
              {session?.user?.plan?.toUpperCase() || "PRO"}
            </span>
          </div>
          <div className="w-full h-1 bg-[#1F2330] rounded-full overflow-hidden">
            <div className="bg-[#6C63FF] h-full w-[65%]" />
          </div>
        </div>

        {/* User Info */}
        {session?.user && (
          <div className="flex items-center gap-3 px-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full border border-[#1F2330]"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#38BDF8]" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F0F2FA] truncate">
                {session.user.name || "Alex Chen"}
              </p>
              <p className="text-[10px] text-[#4A5168] truncate">
                {session.user.email || "alex@founderos.ai"}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
