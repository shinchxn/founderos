"use client";

import { useState } from "react";
import { Mic, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { createMeetingAndProcess } from "./actions";

export function MeetingCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<"options" | "text" | "upload" | "success">("options");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !notes) return;
    
    setLoading(true);
    const res = await createMeetingAndProcess(title, notes);
    setLoading(false);
    
    if (res.success) {
      setMode("success");
      setTimeout(() => {
        setMode("options");
        setTitle("");
        setNotes("");
      }, 3000);
    }
  }

  if (mode === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 border border-[#1a2332] rounded-md bg-[#111820]">
        <CheckCircle2 className="w-12 h-12 text-[#10b981] mb-4" />
        <h3 className="text-xl font-bold text-primary mb-2">Meeting Processed</h3>
        <p className="text-sm text-muted">AI agent is extracting action items and insights.</p>
      </div>
    );
  }

  if (mode === "text") {
    return (
      <div className="flex-1 border border-[#1a2332] rounded-md bg-[#111820] p-6">
        <h3 className="text-lg font-bold text-primary mb-4">Paste Raw Transcript</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Meeting Title (e.g., Weekly Sync)" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-4 py-2 text-primary focus:outline-none focus:border-[#0ea5e9]"
            required
          />
          <textarea 
            placeholder="Paste your meeting notes or raw transcript here..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-4 py-2 text-primary focus:outline-none focus:border-[#0ea5e9] min-h-[200px]"
            required
          />
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setMode("options")}
              className="px-4 py-2 text-sm text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-sm font-semibold px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Process with AI
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-[#1a2332] rounded-md bg-[#111820]/50">
      <div className="max-w-md w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => {
            setIsRecording(!isRecording);
            // Simulate recording
            if (!isRecording) {
                setTimeout(() => setIsRecording(false), 3000);
            }
          }}
          className={`flex flex-col items-center justify-center p-6 border rounded-md transition-colors ${
            isRecording 
            ? "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]" 
            : "border-[#1a2332] bg-[#080b10] hover:border-[#0ea5e9] text-primary"
          }`}
        >
          <Mic className={`w-8 h-8 ${isRecording ? "animate-pulse" : "mb-3"}`} />
          <span className="font-semibold">{isRecording ? "Recording..." : "Record Audio"}</span>
          <span className="text-xs text-muted mt-1 opacity-70">(Demo stub)</span>
        </button>
        <button 
          onClick={() => setMode("text")}
          className="flex flex-col items-center justify-center p-6 border border-[#1a2332] bg-[#080b10] hover:border-[#8b5cf6] rounded-md transition-colors text-primary"
        >
          <FileText className="w-8 h-8 mb-3" />
          <span className="font-semibold">Paste Transcript</span>
          <span className="text-xs text-muted mt-1 opacity-70">Directly into input</span>
        </button>
      </div>
    </div>
  );
}
