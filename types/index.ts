import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;
export type Deal = InferSelectModel<typeof schema.deals>;
export type NewDeal = InferInsertModel<typeof schema.deals>;
export type Meeting = InferSelectModel<typeof schema.meetings>;
export type NewMeeting = InferInsertModel<typeof schema.meetings>;
export type RevenueMetric = InferSelectModel<typeof schema.kpis>;
export type RevenueAnomaly = InferSelectModel<typeof schema.alerts>;
export type Investor = any;
export type InvestorUpdate = InferSelectModel<typeof schema.investor_updates>;
export type SalesDigest = any;
export type AgentRun = InferSelectModel<typeof schema.agent_runs>;

export type AgentType =
  | "meeting_intelligence"
  | "revenue_anomaly"
  | "sales_digest"
  | "investor_update";

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type AgentStatus = "pending" | "running" | "done" | "error";
export type Plan = "free" | "pro";
export type AnomaltySeverity = "low" | "medium" | "high" | "critical";

export interface ActionItem {
  owner: string;
  task: string;
  due: string;
}

export interface MeetingAgentOutput {
  summary: string;
  actionItems: ActionItem[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  nextSteps: string;
  hoursSaved: number;
}

export interface AnomalyOutput {
  anomalies: Array<{
    severity: AnomaltySeverity;
    type: string;
    description: string;
    recommendation: string;
    hoursSaved: number;
  }>;
}

export interface DigestOutput {
  subject: string;
  summary: string;
  htmlBody: string;
  highlights: string[];
  concerns: string[];
  hoursSaved: number;
}

export interface InvestorUpdateOutput {
  subject: string;
  body: string;
  htmlBody: string;
  hoursSaved: number;
}

// API response shape
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
