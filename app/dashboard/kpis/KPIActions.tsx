"use client";

import { Download } from "lucide-react";

export function KPIActions({ kpiDataList }: { kpiDataList: any[] }) {
  const handleExportCSV = () => {
    const headers = ['Week', 'MRR', 'ARR', 'Signups', 'Churn', 'Active Users', 'Runway'];
    const rows = kpiDataList.map(k =>
      [new Date(k.week_start).toLocaleDateString(), k.mrr, k.arr, k.new_signups, k.churn_count, k.active_users, k.runway_months]
    );
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'founderos-kpis.csv';
    a.click();
  };

  return (
    <button onClick={handleExportCSV} className="text-[10px] font-bold tracking-wider uppercase text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
      <Download className="w-3 h-3" /> EXPORT CSV
    </button>
  );
}
