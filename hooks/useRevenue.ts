"use client";

import { useState, useEffect, useCallback } from "react";

export interface KPI {
  id: string;
  workspace_id: string;
  week_start: string;
  mrr: number;
  arr: number;
  new_signups: number;
  churn_count: number;
  active_users: number;
  runway_months: number;
  notes: string | null;
  anomalies: any | null;
  created_at: string;
}

export function useRevenue() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kpis");
      if (!res.ok) throw new Error("Failed to fetch financial KPIs");
      const data = await res.json();
      setKpis(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const addKPI = async (payload: Partial<KPI>) => {
    try {
      const res = await fetch("/api/kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add KPI snapshot");
      }
      const newSnapshot = await res.json();
      setKpis((prev) => [newSnapshot, ...prev]);
      return { success: true, kpi: newSnapshot };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    kpis,
    loading,
    error,
    mutate: fetchKPIs,
    addKPI,
  };
}
