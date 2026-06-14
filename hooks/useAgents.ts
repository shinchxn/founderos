"use client";

import { useState, useEffect, useCallback } from "react";

export interface AgentRun {
  id: string;
  workspace_id: string;
  agent_type: string;
  status: "running" | "completed" | "failed";
  input_summary: string | null;
  output_summary: string | null;
  prompt_sent: string | null;
  raw_ai_response: string | null;
  error_message: string | null;
  duration_ms: number | null;
  triggered_by: string | null;
  items_processed: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface SavedHours {
  totalMinutes: number;
  hoursSaved: number;
  actionCount: number;
  breakdown: Array<{ agent_type: string; minutes: number }>;
}

export function useAgents() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [hoursSummary, setHoursSummary] = useState<SavedHours | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingHours, setLoadingHours] = useState(true);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res = await fetch("/api/agents/runs");
      if (!res.ok) throw new Error("Failed to fetch agent runs");
      const data = await res.json();
      setRuns(data);
      setRunsError(null);
    } catch (err: any) {
      setRunsError(err.message || "An error occurred fetching runs");
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  const fetchHoursSummary = useCallback(async () => {
    setLoadingHours(true);
    try {
      const res = await fetch("/api/agents/hours");
      if (!res.ok) throw new Error("Failed to fetch saved hours");
      const data = await res.json();
      setHoursSummary(data);
      setHoursError(null);
    } catch (err: any) {
      setHoursError(err.message || "An error occurred fetching hours");
    } finally {
      setLoadingHours(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
    fetchHoursSummary();
  }, [fetchRuns, fetchHoursSummary]);

  const triggerAgent = async (agentType: "anomaly_detection" | "sales_digest" | "investor_update") => {
    try {
      const res = await fetch("/api/agents/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_type: agentType }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to trigger agent");
      }
      
      // Refresh histories after brief delay
      setTimeout(() => {
        fetchRuns();
        fetchHoursSummary();
      }, 1500);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    runs,
    hoursSummary,
    loadingRuns,
    loadingHours,
    runsError,
    hoursError,
    triggerAgent,
    refreshHours: fetchHoursSummary,
    refreshRuns: fetchRuns,
  };
}
