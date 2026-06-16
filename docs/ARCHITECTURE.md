# Architecture

FounderOS is built on Next.js 15, Vercel, and AWS.

## Core Stack
- **Framework**: Next.js 15 App Router
- **Database**: Aurora PostgreSQL Serverless v2 + Drizzle ORM
- **Auth**: NextAuth.js v5 (Google OAuth)
- **Styling**: Vanilla CSS + Tailwind
- **AI**: AWS Bedrock (Claude 3.5 Sonnet & Haiku)

## Data Flow
- User interacts with React Server Components and Server Actions.
- Background agents run on Vercel Cron.
- Long-running Bedrock AI queries use `p-retry` to handle AWS throttling.
- Integrations (Stripe Connect, Google Calendar) use encrypted OAuth tokens stored in `workspace_integrations`.

## Security
- NextAuth sessions are stored in DB.
- IDOR protections on all billing/checkout and API routes.
- Webhooks use Stripe signature verification and `stripe_webhook_events` for idempotency.
- Rate limiting applied to API and cron endpoints via Upstash Redis.
