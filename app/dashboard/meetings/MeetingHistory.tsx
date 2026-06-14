"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, AlertTriangle, MessageSquare, ChevronRight, Play, Loader2, ArrowLeft } from "lucide-react";

interface Meeting {
  id: string;
  workspace_id: string;
  title: string;
  meeting_date: Date | string;
  attendees: any | null;
  raw_notes: string | null;
  s3_key: string | null;
  processed: boolean | null;
  processed_at: Date | string | null;
  extracted_data: any | null;
  created_at?: Date | string | null;
}

export function MeetingHistory({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  const handleReprocess = async (id: string) => {
    setAnalyzingId(id);
    try {
      const res = await fetch(`/api/meetings/${id}/analyze`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.meeting) {
          setMeetings((prev) => prev.map((m) => (m.id === id ? data.meeting : m)));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0 overflow-hidden">
      {/* Meetings List (Left 2 cols or 1 col depending on selection) */}
      <div className={`lg:col-span-1 flex flex-col h-full bg-[#111820] border border-[#1a2332] rounded-md overflow-hidden ${selectedMeetingId ? "hidden lg:flex" : ""}`}>
        <div className="px-4 py-3 border-b border-[#1a2332] bg-[#080b10] flex justify-between items-center shrink-0">
          <h3 className="font-semibold text-primary">Meeting Logger</h3>
          <span className="font-mono text-xs text-muted">{meetings.length} Total</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#1a2332] p-1 space-y-1">
          {meetings.length === 0 ? (
            <div className="p-8 text-center text-muted font-sans text-sm">
              No meetings found. Paste a transcript above to begin.
            </div>
          ) : (
            meetings.map((m) => {
              const dateStr = new Date(m.meeting_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              const isSelected = m.id === selectedMeetingId;
              const hasActionItems = m.extracted_data?.action_items?.length > 0;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeetingId(m.id)}
                  className={`w-full text-left p-3 rounded cursor-pointer transition-colors flex items-center justify-between group ${
                    isSelected 
                      ? "bg-[#1a2332]/80 border border-[#0ea5e9]/30" 
                      : "bg-transparent hover:bg-[#1a2332]/35 border border-transparent"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="text-[11px] font-mono font-medium text-muted">{dateStr}</span>
                      {m.processed ? (
                        <span className="text-[9px] font-bold text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.25 rounded">PROCESSED</span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.25 rounded">QUEUE</span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold truncate text-primary group-hover:text-[#0ea5e9] transition-colors">{m.title}</h4>
                    {m.extracted_data?.summary && (
                      <p className="text-xs text-muted truncate mt-1 max-w-[240px]">{m.extracted_data.summary}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Details Area (Right 2 cols) */}
      <div className="lg:col-span-2 flex flex-col h-full bg-[#111820] border border-[#1a2332] rounded-md overflow-hidden min-h-[400px]">
        {selectedMeeting ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a2332] bg-[#080b10] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedMeetingId(null)} 
                  className="lg:hidden p-1.5 bg-[#1a2332] rounded text-muted hover:text-primary transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-bold text-primary text-base">{selectedMeeting.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted font-mono">
                      {new Date(selectedMeeting.meeting_date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </span>
                    {selectedMeeting.extracted_data?.sentiment && (
                      <>
                        <span className="text-muted text-xs">•</span>
                        <span className="text-xs uppercase font-mono font-bold text-muted">
                          Sentiment: <span className={
                            selectedMeeting.extracted_data.sentiment === "positive" ? "text-[#10b981]" : 
                            selectedMeeting.extracted_data.sentiment === "negative" ? "text-red-400" : "text-amber-500"
                          }>{selectedMeeting.extracted_data.sentiment}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleReprocess(selectedMeeting.id)}
                disabled={analyzingId === selectedMeeting.id}
                className="bg-[#1a2332] border border-[#1a2332] hover:border-[#0ea5e9]/30 text-primary hover:text-[#0ea5e9] text-xs font-semibold h-8 px-3 rounded flex items-center gap-1.5 disabled:opacity-50 transition-all font-mono"
              >
                {analyzingId === selectedMeeting.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    REANALYZING...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    RERUN AGENT
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Section */}
              {selectedMeeting.extracted_data?.summary ? (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Executive Summary</h4>
                  <p className="text-sm text-primary leading-relaxed bg-[#080b10] border border-[#1a2332] rounded p-4">
                    {selectedMeeting.extracted_data.summary}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin mb-3 animate-duration-1000" />
                  <p className="text-sm text-muted">Agent is analyzing and extracting action items... click &quot;RERUN AGENT&quot; if stuck.</p>
                </div>
              )}

              {/* Action Items List */}
              {selectedMeeting.extracted_data?.action_items && selectedMeeting.extracted_data.action_items.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    Extracted Action Items ({selectedMeeting.extracted_data.action_items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedMeeting.extracted_data.action_items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-[#1a2332]/40 border border-[#1a2332] rounded px-4 py-2 text-sm font-mono font-medium">
                        <div className="flex items-center gap-2 pr-4 text-primary font-sans">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            item.priority === "high" ? "bg-red-400" : item.priority === "medium" ? "bg-amber-400" : "bg-blue-400"
                          }`} />
                          <span>{item.title}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.assignee && (
                            <span className="text-xs text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded uppercase font-bold text-[10px]">@{item.assignee.split("@")[0]}</span>
                          )}
                          {item.due_date && (
                            <span className="text-xs text-muted">BY {new Date(item.due_date).toLocaleDateString(undefined, {month: "short", day: "numeric"})}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decisions & Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Decisions Column */}
                {selectedMeeting.extracted_data?.decisions && selectedMeeting.extracted_data.decisions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#0ea5e9]" /> Key Decisions
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 bg-[#080b10] border border-[#1a2332] rounded p-4 text-sm font-sans">
                      {selectedMeeting.extracted_data.decisions.map((dec: string, i: number) => (
                        <li key={i} className="text-primary pr-1 leading-snug">{dec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks Column */}
                {selectedMeeting.extracted_data?.risks && selectedMeeting.extracted_data.risks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#ef4444] mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#ef4444]" /> Identified Risks
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded p-4 text-sm font-sans">
                      {selectedMeeting.extracted_data.risks.map((risk: string, i: number) => (
                        <li key={i} className="text-primary pr-1 leading-snug">{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Raw Transcript Segment */}
              {selectedMeeting.raw_notes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Pasted Live Notes / Transcript</h4>
                  <pre className="text-xs text-muted bg-[#080b10] border border-[#1a2332] rounded p-4 overflow-x-auto font-mono max-h-48 whitespace-pre-wrap leading-relaxed">
                    {selectedMeeting.raw_notes}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
            <Calendar className="w-12 h-12 text-muted/30 mb-3" />
            <h4 className="font-semibold text-primary mb-1">No Meeting Active</h4>
            <p className="text-xs text-muted max-w-xs">Select a meeting logger entry from the left-hand rail to inspect extracted action item milestones, decisions, sentiment, and risks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
