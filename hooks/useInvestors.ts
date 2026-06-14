"use client";

import { useState, useEffect, useCallback } from "react";

export interface InvestorUpdate {
  id: string;
  workspace_id: string;
  week_start: string;
  subject: string;
  body: string;
  status: "draft" | "sent";
  sent_at: string | null;
  sent_to_email: string | null;
  agent_generated: boolean;
  created_at: string;
  updated_at: string;
}

export function useInvestors() {
  const [updates, setUpdates] = useState<InvestorUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/investor-updates");
      if (!res.ok) throw new Error("Failed to fetch investor updates");
      const data = await res.json();
      setUpdates(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred fetching updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const draftAutoUpdate = async () => {
    try {
      const res = await fetch("/api/investor-updates", { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to draft investor update");
      }
      const newDraft = await res.json();
      setUpdates((prev) => [newDraft, ...prev]);
      return { success: true, update: newDraft };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const sendUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/investor-updates/${id}/send`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send update");
      }
      const data = await res.json();
      if (data.success && data.update) {
        setUpdates((prev) => prev.map((u) => (u.id === id ? data.update : u)));
      }
      return { success: true, messageId: data.messageId, sentViaAws: data.sentViaAws };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    updates,
    loading,
    error,
    mutate: fetchUpdates,
    draftAutoUpdate,
    sendUpdate,
  };
}
