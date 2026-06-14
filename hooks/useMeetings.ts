"use client";

import { useState, useEffect, useCallback } from "react";

export interface Meeting {
  id: string;
  workspace_id: string;
  title: string;
  meeting_date: string;
  attendees: any | null;
  raw_notes: string | null;
  s3_key: string | null;
  processed: boolean;
  processed_at: string | null;
  extracted_data: {
    summary?: string;
    action_items?: Array<{ title: string; assignee: string | null; due_date: string | null; priority: string }>;
    decisions?: string[];
    risks?: string[];
    sentiment?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meetings");
      if (!res.ok) throw new Error("Failed to fetch meetings");
      const data = await res.json();
      setMeetings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const createMeeting = async (payload: { title: string; raw_notes: string; meeting_date?: string }) => {
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create meeting");
      }
      const newMtg = await res.json();
      setMeetings((prev) => [newMtg, ...prev]);
      return { success: true, meeting: newMtg };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const analyzeMeeting = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}/analyze`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis request failed");
      }
      const data = await res.json();
      if (data.success && data.meeting) {
        setMeetings((prev) => prev.map((m) => (m.id === id ? data.meeting : m)));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete meeting");
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    meetings,
    loading,
    error,
    mutate: fetchMeetings,
    createMeeting,
    analyzeMeeting,
    deleteMeeting,
  };
}
