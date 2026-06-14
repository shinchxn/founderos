import { pgTable, text, timestamp, integer, boolean, json, varchar, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password_hash: text("password_hash"),
  created_at: timestamp("created_at").defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  owner_id: text("owner_id").notNull(),
  plan: text("plan").default("free").notNull(),
  industry: text("industry"),
  stage: text("stage"),
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  investor_email: text("investor_email"),
  setup_completed: boolean("setup_completed").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  company: text("company"),
  title: text("title"),
  phone: text("phone"),
  notes: text("notes"),
  tags: json("tags"),
  last_contacted_at: timestamp("last_contacted_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  contact_id: text("contact_id"),
  title: text("title").notNull(),
  value: integer("value").notNull(),
  stage: varchar("stage", { length: 50 }).notNull(), // lead, qualified, proposal, negotiation, won, lost
  probability: integer("probability").notNull(),
  expected_close_date: timestamp("expected_close_date"),
  notes: text("notes"),
  priority_score: integer("priority_score"),
  last_agent_note: text("last_agent_note"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull(), // todo, in_progress, done
  priority: varchar("priority", { length: 50 }).notNull(), // low, medium, high
  assignee_email: text("assignee_email"),
  due_date: timestamp("due_date"),
  source: varchar("source", { length: 50 }).notNull(), // manual, agent
  linked_entity_type: text("linked_entity_type"), // contact, deal, meeting
  linked_entity_id: text("linked_entity_id"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const kpis = pgTable("kpis", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  week_start: timestamp("week_start").notNull(),
  mrr: integer("mrr").notNull(),
  arr: integer("arr").notNull(),
  new_signups: integer("new_signups").notNull(),
  churn_count: integer("churn_count").notNull(),
  active_users: integer("active_users").notNull(),
  runway_months: integer("runway_months").notNull(),
  notes: text("notes"),
  anomalies: json("anomalies"),
  created_at: timestamp("created_at").defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  title: text("title").notNull(),
  meeting_date: timestamp("meeting_date").notNull(),
  attendees: json("attendees"),
  raw_notes: text("raw_notes"),
  s3_key: text("s3_key"),
  processed: boolean("processed").default(false),
  processed_at: timestamp("processed_at"),
  extracted_data: json("extracted_data"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const investor_updates = pgTable("investor_updates", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  week_start: timestamp("week_start").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // draft, sent
  sent_at: timestamp("sent_at"),
  sent_to_email: text("sent_to_email"),
  agent_generated: boolean("agent_generated").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const agent_runs = pgTable("agent_runs", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  agent_type: varchar("agent_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // running, completed, failed
  input_summary: text("input_summary"),
  output_summary: text("output_summary"),
  prompt_sent: text("prompt_sent"),
  raw_ai_response: text("raw_ai_response"),
  error_message: text("error_message"),
  duration_ms: integer("duration_ms"),
  triggered_by: text("triggered_by"),
  items_processed: integer("items_processed"),
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // anomaly, cold_deal, overdue_task, milestone
  title: text("title").notNull(),
  body: text("body").notNull(),
  severity: varchar("severity", { length: 50 }).notNull(), // low, medium, high
  dismissed: boolean("dismissed").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const agent_hours_saved = pgTable("agent_hours_saved", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull(),
  agent_type: varchar("agent_type", { length: 100 }).notNull(),
  action_description: text("action_description").notNull(),
  estimated_minutes_saved: integer("estimated_minutes_saved").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    }
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [
    {
      compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    }
  ]
);
