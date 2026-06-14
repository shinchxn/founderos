"use client";

import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Users, CreditCard, ChevronRight, X, Loader2, ArrowRight, Trash2 } from "lucide-react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

export interface Deal {
  id: string;
  workspace_id: string;
  contact_id: string | null;
  title: string;
  value: number;
  stage: string;
  probability: number;
  notes: string | null;
  priority_score: number | null;
  last_agent_note: string | null;
  created_at?: string | Date | null;
}

export interface Contact {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  notes: string | null;
  tags: any;
  created_at?: string | Date | null;
}

function DraggableDealCard({ deal, contacts, onDelete }: { deal: Deal, contacts: Contact[], onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: deal,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const clientLabel = contacts.find((c) => c.id === deal.contact_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-[#1a2332]/30 border border-[#1a2332] hover:border-[#0ea5e9]/30 rounded-md p-3 cursor-grab active:cursor-grabbing hover:bg-[#1a2332]/50 transition-colors z-50 relative"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1.5">
          <span className="text-[9px] font-bold text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded uppercase font-mono">
            Prob: {deal.probability}%
          </span>
          {deal.priority_score && deal.priority_score > 0 ? (
            <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 rounded uppercase">
              Action Score: {deal.priority_score}
            </span>
          ) : null}
        </div>
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onDelete(deal.id); }} 
          className="text-muted hover:text-[#ef4444] transition-colors relative z-50 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <h4 className="text-xs font-bold text-primary mb-1 truncate">
        {deal.title}
      </h4>
      {clientLabel && (
        <p className="text-[11px] text-muted mb-3 truncate flex items-center gap-1.5">
          <span>{clientLabel.name}</span>
          {clientLabel.company && (
            <span className="opacity-70">• {clientLabel.company}</span>
          )}
        </p>
      )}
      <div className="flex justify-between items-end mt-auto pt-2 border-t border-[#1a2332]/40">
        <span className="font-mono text-sm font-semibold text-[#10b981]">
          ${deal.value.toLocaleString()}
        </span>
        <span className="text-[9px] font-mono text-muted">
          {deal.created_at ? new Date(deal.created_at).toLocaleDateString(undefined, {month: "short", day: "numeric"}) : "—"}
        </span>
      </div>
    </div>
  );
}

function DroppableColumn({ stage, dealsList, contacts, calculateStageSum, onDeleteDeal }: { stage: any, dealsList: Deal[], contacts: Contact[], calculateStageSum: (deals: Deal[]) => string, onDeleteDeal: (id: string) => void }) {
  const { setNodeRef } = useDroppable({
    id: stage.key,
  });

  return (
    <div
      ref={setNodeRef}
      className="min-w-[280px] w-[280px] flex flex-col h-full bg-[#111820] rounded-md border border-[#1a2332] shrink-0"
    >
      <div className="p-3 border-b border-[#1a2332] flex justify-between items-center bg-[#080b10] sticky top-0 rounded-t-md shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
          <h3 className="text-[11px] font-bold tracking-wider uppercase text-primary">
            {stage.label} <span className="text-muted ml-0.5">{dealsList.length}</span>
          </h3>
        </div>
        <span className="font-mono text-xs font-semibold text-muted">
          {calculateStageSum(dealsList)}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {dealsList.length === 0 ? (
          <div className="py-8 text-center text-muted font-sans text-xs">
            No deals in {stage.label}
          </div>
        ) : (
          dealsList.map((d) => (
            <DraggableDealCard key={d.id} deal={d} contacts={contacts} onDelete={onDeleteDeal} />
          ))
        )}
      </div>
    </div>
  );
}

export function CRMExplorer({
  initialDeals,
  initialContacts,
}: {
  initialDeals: Deal[];
  initialContacts: Contact[];
}) {
  const [activeTab, setActiveTab] = useState<"kanban" | "contacts">("kanban");
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState("");

  // Modal / Sheet states
  const [showDealSheet, setShowDealSheet] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);

  // Form states
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealStage, setDealStage] = useState("lead");
  const [dealProb, setDealProb] = useState("10");
  const [dealContact, setDealContact] = useState("");
  const [dealNotes, setDealNotes] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const stages = [
    { key: "lead", label: "Lead", color: "bg-muted" },
    { key: "qualified", label: "Qualified", color: "bg-blue-500" },
    { key: "proposal", label: "Proposal", color: "bg-amber-500" },
    { key: "negotiation", label: "Negotiation", color: "bg-purple-500" },
    { key: "won", label: "Won", color: "bg-green-500" },
    { key: "lost", label: "Lost", color: "bg-red-500" },
  ];

  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.key] = deals.filter(
      (d) =>
        d.stage === stage.key &&
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return acc;
  }, {} as Record<string, Deal[]>);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateStageSum = (stageDeals: Deal[]) => {
    const total = stageDeals.reduce((sum, d) => sum + d.value, 0);
    return total >= 1000 ? `$${(total / 1000).toFixed(0)}k` : `$${total}`;
  };

  const handleDeleteDeal = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this deal?")) return;
    try {
      const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeals(deals.filter(d => d.id !== id));
        toast.success("Deal deleted");
      } else {
        toast.error("Failed to delete deal");
      }
    } catch (e) {
      toast.error("Failed to delete deal");
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle || !dealValue) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: dealTitle,
          value: parseInt(dealValue) || 0,
          stage: dealStage,
          probability: parseInt(dealProb) || 0,
          notes: dealNotes,
          contact_id: dealContact || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeals([data, ...deals]);
        setShowDealSheet(false);
        setDealTitle(""); setDealValue(""); setDealStage("lead"); setDealProb("10"); setDealNotes(""); setDealContact("");
        toast.success(`Deal "${data.title}" created successfully`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create deal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail || null,
          company: contactCompany || null,
          title: contactTitle || null,
          phone: contactPhone || null,
          notes: contactNotes || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContacts([data, ...contacts]);
        setShowContactSheet(false);
        setContactName(""); setContactEmail(""); setContactCompany(""); setContactTitle(""); setContactPhone(""); setContactNotes("");
        toast.success(`Contact "${data.name}" created successfully`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id;
    const newStage = over.id;

    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    const originalDeals = [...deals];
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      if (!res.ok) {
        setDeals(originalDeals);
      }
    } catch (err) {
      setDeals(originalDeals);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Search and Tabs Controller */}
      <div className="flex justify-between items-center py-4 border-b border-[#1a2332] bg-[#080b10] shrink-0 z-10 gap-4">
        {/* View Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-4 py-2 text-sm font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === "kanban"
                ? "text-[#0ea5e9] border-[#0ea5e9]"
                : "text-muted border-transparent hover:text-primary"
            }`}
          >
            Pipeline (Kanban)
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2 text-sm font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === "contacts"
                ? "text-[#0ea5e9] border-[#0ea5e9]"
                : "text-muted border-transparent hover:text-primary"
            }`}
          >
            Contacts Table
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder={activeTab === "kanban" ? "Search Active Deals..." : "Search Contacts..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111820] border border-[#1a2332] rounded-md pl-9 pr-4 py-1.5 text-xs text-primary focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <button
            onClick={() => {
              if (activeTab === "kanban") {
                setShowDealSheet(true);
              } else {
                setShowContactSheet(true);
              }
            }}
            className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            {activeTab === "kanban" ? "NEW DEAL" : "NEW CONTACT"}
          </button>
        </div>
      </div>

      {/* Kanban Pipeline View */}
      {activeTab === "kanban" && (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex-1 flex overflow-x-auto gap-4 py-4 min-h-0 select-none">
            {stages.map((stage) => {
              const list = dealsByStage[stage.key] || [];
              return (
                <DroppableColumn key={stage.key} stage={stage} dealsList={list} contacts={contacts} calculateStageSum={calculateStageSum} onDeleteDeal={handleDeleteDeal} />
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Contacts Table Database View */}
      {activeTab === "contacts" && (
        <div className="flex-1 overflow-auto py-4 bg-[#111820] border border-[#1a2332] rounded-md mt-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1a2332] bg-[#080b10]">
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                  Contact Name
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                  Company
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                  Title
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider text-right">
                  Added Date
                </th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted font-sans border-t border-[#1a2332]">
                    No contacts found. Click &quot;NEW CONTACT&quot; to populate.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#1a2332] hover:bg-[#1a2332]/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold text-primary flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1a2332] flex items-center justify-center text-muted text-[10px]">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-muted">
                      {c.email || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-primary">
                      {c.company || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {c.title || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-muted">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- OFFCANVAS SHEETS / MODALS (Tailwind Native Primitives Only) --- */}

      {/* NEW DEAL SHEET */}
      {showDealSheet && (
        <div className="fixed inset-0 bg-[#080b10]/80 backdrop-blur-sm z-[100] flex justify-end transition-all">
          <div className="w-[450px] h-full bg-[#111820] border-l border-[#1a2332] p-6 flex flex-col justify-between animation-duration-200 shadow-2xl animate-in slide-in-from-right">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-primary text-base">New Pipeline Deal</h3>
                  <p className="text-xs text-muted">Insert a new deal snapshot into the sales pipeline.</p>
                </div>
                <button
                  onClick={() => setShowDealSheet(false)}
                  className="p-1.5 text-muted hover:text-primary bg-[#1a2332] hover:bg-[#1a2332]/80 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDeal} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                    Deal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Corp Enterprise License"
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Deal Value ($) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="50000"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Win Probability (%)
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      min="0"
                      max="100"
                      value={dealProb}
                      onChange={(e) => setDealProb(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Stage
                    </label>
                    <select
                      value={dealStage}
                      onChange={(e) => setDealStage(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    >
                      {stages.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Associated Contact
                    </label>
                    <select
                      value={dealContact}
                      onChange={(e) => setDealContact(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    >
                      <option value="">Select contact...</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.company || "No Company"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                    Internal Notes / Context
                  </label>
                  <textarea
                    placeholder="Initial exploratory call completed..."
                    value={dealNotes}
                    onChange={(e) => setDealNotes(e.target.value)}
                    className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-xs text-primary focus:outline-none focus:border-[#0ea5e9] min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDealSheet(false)}
                    className="px-4 py-2 text-xs font-semibold text-muted hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 hover:opacity-95"
                  >
                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    CREATE DEAL
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NEW CONTACT SHEET */}
      {showContactSheet && (
        <div className="fixed inset-0 bg-[#080b10]/80 backdrop-blur-sm z-[100] flex justify-end transition-all">
          <div className="w-[450px] h-full bg-[#111820] border-l border-[#1a2332] p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-primary text-base">New CRM Contact</h3>
                  <p className="text-xs text-muted">Add a new external lead contact to your workspace database.</p>
                </div>
                <button
                  onClick={() => setShowContactSheet(false)}
                  className="p-1.5 text-muted hover:text-primary bg-[#1a2332] hover:bg-[#1a2332]/80 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateContact} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Erlich Bachman"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Work Email
                    </label>
                    <input
                      type="email"
                      placeholder="erlich@bachmanity.co"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+1 (415) 555-0199"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="Aviato"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      placeholder="Managing Director"
                      value={contactTitle}
                      onChange={(e) => setContactTitle(e.target.value)}
                      className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                    Context / Key Background Details
                  </label>
                  <textarea
                    placeholder="Interested in our seed stage incubator SaaS bundle..."
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    className="w-full bg-[#080b10] border border-[#1a2332] rounded px-4 py-2 text-xs text-primary focus:outline-none focus:border-[#0ea5e9] min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowContactSheet(false)}
                    className="px-4 py-2 text-xs font-semibold text-muted hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 hover:opacity-95"
                  >
                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    CREATE CONTACT
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
