"use client";

import { useState, useEffect, useCallback } from "react";

export interface Deal {
  id: string;
  workspace_id: string;
  contact_id: string | null;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  priority_score: number | null;
  last_agent_note: string | null;
  created_at: string;
  updated_at: string;
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deals");
      if (!res.ok) throw new Error("Failed to fetch deals");
      const data = await res.json();
      setDeals(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const createDeal = async (payload: Partial<Deal>) => {
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create deal");
      }
      const newDeal = await res.json();
      setDeals((prev) => [newDeal, ...prev]);
      return { success: true, deal: newDeal };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateDeal = async (id: string, payload: Partial<Deal>) => {
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update deal");
      }
      const updatedDeal = await res.json();
      setDeals((prev) => prev.map((d) => (d.id === id ? updatedDeal : d)));
      return { success: true, deal: updatedDeal };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete deal");
      setDeals((prev) => prev.filter((d) => d.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    deals,
    loading,
    error,
    mutate: fetchDeals,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}
