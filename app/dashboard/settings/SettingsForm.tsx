"use client";

import { useState } from "react";
import { updateWorkspaceSettings } from "./actions";
import { DemoDataButton } from "./DemoDataButton";
import { Loader2, CheckCircle2 } from "lucide-react";

export function SettingsForm({ initialName, initialEmail }: { initialName: string, initialEmail: string }) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await updateWorkspaceSettings(name, email);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-primary mb-2">Startup Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary mb-2">Investor Email Copy</label>
        <input 
          type="text" 
          placeholder="investors@yourstartup.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
        />
      </div>
      
      <div className="pt-4 border-t border-[#1a2332] flex justify-between items-center">
        <DemoDataButton />
        <button 
          onClick={handleSave}
          disabled={loading || !name}
          className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : null}
          {success ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
