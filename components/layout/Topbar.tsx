"use client";

import { usePathname } from "next/navigation";
import { Bell, Calendar } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard Summary",
  "/deals": "Pipeline Progress",
  "/meetings": "Meetings Intelligence",
  "/revenue": "Revenue Metrics & Anomalies",
  "/investors": "Investors Relations",
  "/agents": "AI Active Status",
  "/digest": "Weekly Sales Digest",
  "/settings": "Account Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    key === "/" ? pathname === "/" : pathname.startsWith(key)
  )?.[1] ?? "FounderOS";

  return (
    <header className="h-16 border-b border-[#1F2330] bg-[#111318]/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
      <h1 className="text-base font-bold text-[#F0F2FA]">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Elegant Dark Calendar Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1F2330] bg-[#191C23] text-xs text-[#8B93A9]">
          <Calendar size={14} />
          <span>Last 30 Days</span>
        </div>
        {/* Notification Button */}
        <button className="h-9 w-9 rounded-xl border border-[#1F2330] bg-[#191C23] flex items-center justify-center text-[#8B93A9] hover:text-[#F0F2FA] transition-colors cursor-pointer relative">
          <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-[#6C63FF] rounded-full" />
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
