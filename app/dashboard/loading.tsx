import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[60vh] text-muted animate-pulse">
      <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center text-[#0ea5e9] mb-4 border border-[#0ea5e9]/20">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <h2 className="text-lg font-bold text-primary tracking-tight mb-2">Syncing Data</h2>
      <p className="text-sm">Retrieving your workspace metrics...</p>
    </div>
  );
}
