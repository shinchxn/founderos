"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function KPIChart({ kpiDataList }: { kpiDataList: any[] }) {
  const chartData = kpiDataList.slice().reverse().map(k => ({
    week: new Date(k.week_start).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    mrr: k.mrr,
    signups: k.new_signups,
  }));

  if (kpiDataList.length === 0) {
    return <div className="text-muted text-sm mb-10 italic w-full text-center flex items-center justify-center h-full">No trend data available. Click "GENERATE DEMO DATA" to populate.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis dataKey="week" stroke="#374151" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#111820', border: '1px solid #1a2332', fontSize: 12, borderRadius: '4px' }} itemStyle={{ color: '#f3f4f6' }} />
        <Line type="monotone" dataKey="mrr" stroke="#0ea5e9" dot={false} strokeWidth={2} name="MRR ($)" />
        <Line type="monotone" dataKey="signups" stroke="#8b5cf6" dot={false} strokeWidth={2} name="Signups" />
      </LineChart>
    </ResponsiveContainer>
  );
}
