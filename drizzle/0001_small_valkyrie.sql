CREATE TABLE "workspace_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"external_account_id" text,
	"status" text NOT NULL,
	"connected_at" timestamp DEFAULT now(),
	"last_synced_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "kpis" ADD COLUMN "stripe_synced" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "source" varchar(50) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "external_event_id" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_external_event_id_unique" UNIQUE("external_event_id");