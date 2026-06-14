"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function DemoDataButton() {
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    if (!window.confirm("Are you sure? This will delete all Tasks, Deals, Contacts, Meetings, KPIs, Alerts, and Agent Runs for this workspace. This action cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/workspaces/demo-data", { method: "DELETE" });
      if (res.ok) {
        toast.success("Demo data cleared successfully");
        window.location.reload();
      } else {
        toast.error("Failed to clear data");
      }
    } catch (e) {
      toast.error("Failed to clear data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClear} 
      disabled={loading}
      className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Clear All Demo Data
    </button>
  );
}
