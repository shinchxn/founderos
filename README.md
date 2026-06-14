<div align="center">

<img src="https://img.shields.io/badge/FOS-FounderOS-0ea5e9?style=for-the-badge&labelColor=080b10" alt="FounderOS"/>

# FounderOS

### AI Chief of Staff for Early-Stage Startups

*Stop managing tools. Start building your company.*

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

[![AWS Aurora](https://img.shields.io/badge/Aurora_PostgreSQL-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/rds/aurora)
[![AWS Bedrock](https://img.shields.io/badge/AWS_Bedrock-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/bedrock)
[![AWS S3](https://img.shields.io/badge/Amazon_S3-569A31?style=flat-square&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3)
[![AWS SES](https://img.shields.io/badge/AWS_SES-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ses)

[![H0 Hackathon](https://img.shields.io/badge/H0_Hackathon-Track_2_B2B-8b5cf6?style=flat-square)](https://hack.devpost.com)
[![License](https://img.shields.io/badge/License-MIT-22d3a5?style=flat-square)](LICENSE)

<br/>
<img src="https://placehold.co/1200x675/080b10/ffffff?text=FounderOS+Platform+Screenshot+(Hero)" alt="FounderOS Hero Screenshot" width="100%" style="border-radius: 12px; margin-top: 24px;"/>
<br/>

</div>

---

## The Problem

Early-stage founders waste 10+ hours per week on admin that does not move the business forward — updating CRM records, writing investor emails, tracking metrics across spreadsheets, reviewing meeting notes for action items.

Every tool they use was built for someone else. FounderOS is the first workspace built specifically for early-stage startups.

---

## The Solution

FounderOS replaces 15 disconnected tools with one AI-native workspace. Four autonomous agents run in the background every week, automating the most time-consuming founder tasks automatically.

---

## AI Agents

| Agent | Trigger | What it does |
|---|---|---|
| 🎙️ **Meeting Intelligence** | Note uploaded | Extracts action items, detects risks, updates CRM, creates tasks |
| 📊 **Revenue Anomaly** | Daily cron | Flags MRR drops, churn spikes, runway risk before they become crises |
| 💰 **Sales Digest** | Weekly cron | Scores every deal by priority, generates 3 high-priority follow-up tasks |
| ✉️ **Investor Update** | Friday cron | Drafts weekly investor email, sends via AWS SES in one click |

---

## AWS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Founder Browser                       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ┌────────────────────────▼────────────────────────────────┐
                         │              Next.js 14 on Vercel                        │
                         │         App Router · API Routes · Server Actions         │
                         └───┬──────────┬──────────┬──────────┬────────────────────┘
                             │          │          │          │
                                 ▼          ▼          ▼          ▼
                                 ┌───────┐ ┌───────┐ ┌───────┐ ┌──────────┐
                                 │Aurora │ │Bedrock│ │  S3   │ │   SES    │
                                 │  PG   │ │Claude │ │Files  │ │  Email   │
                                 │  v2   │ │Sonnet │ │       │ │Delivery  │
                                 └───────┘ └───────┘ └───────┘ └──────────┘
                                     ▲
                                         │ SQL (pg + SSL)
                                             │
                                             ┌───┴──────────────────────────────────────────────────────┐
                                             │                 Vercel Cron Jobs                          │
                                             │   /api/cron/agents  (daily 08:00 UTC)                    │
                                             │   /api/cron/meetings (every 5 minutes)                   │
                                             └──────────────────────────────────────────────────────────┘
```

---

## AWS Stack

| Service | Purpose | SDK |
|---|---|---|
| **Aurora PostgreSQL Serverless v2** | Primary database — 11 relational tables | `pg` npm package |
| **AWS Bedrock Claude Sonnet** | Primary AI for all 4 agents | `@aws-sdk/client-bedrock-runtime` |
| **AWS Bedrock Claude Haiku** | Fast structured meeting extraction | `@aws-sdk/client-bedrock-runtime` |
| **Amazon S3** | Meeting note file storage | `@aws-sdk/client-s3` |
| **AWS SES** | Direct investor update email delivery | `@aws-sdk/client-ses` |

---

## Full Tech Stack

```
Frontend      Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · Recharts
Backend       Next.js API Routes · Server Actions · Vercel Serverless Functions
Database      Aurora PostgreSQL Serverless v2 (AWS RDS)
AI Primary    AWS Bedrock — claude-sonnet-4-5 · claude-haiku-20240307
AI Fallback   OpenAI GPT-4o-mini (silent fallback if Bedrock unavailable)
Storage       Amazon S3
Email         AWS SES
Auth          NextAuth · Google OAuth
Payments      Stripe Subscriptions
Deployment    Vercel · Vercel Cron Jobs
```

---

## Features

### Unified Dashboard
![Dashboard View](https://placehold.co/1000x500/090d1a/ffffff?text=Dashboard+Screenshot)
- MRR, active deals, open tasks, runway with WoW trend indicators
- **ROI Dashboard** — Live hours-saved counter showing cumulative time automated per agent
- **Setup Progress** — Guided onboarding that works with real founder data from minute one

### CRM and Pipeline
![CRM and Pipeline View](https://placehold.co/1000x500/090d1a/ffffff?text=CRM+%26+Pipeline+Screenshot)
- Contact management, deal staleness indicators, AI-scored kanban board

### Financial KPIs
![Financial KPIs View](https://placehold.co/1000x500/090d1a/ffffff?text=Financial+KPIs+Screenshot)
- Weekly metric tracking with anomaly markers on the trend chart

### Meeting Vault
![Meeting Vault View](https://placehold.co/1000x500/090d1a/ffffff?text=Meeting+Vault+Screenshot)
- Upload notes, extract structure with AI, view full prompt and response audit trail

### Investor Updates
![Investor Updates View](https://placehold.co/1000x500/090d1a/ffffff?text=Investor+Updates+Screenshot)
- AI-drafted, editable, sent via AWS SES, exportable as PDF

### Agent Hub
![Agent Hub View](https://placehold.co/1000x500/090d1a/ffffff?text=Agent+Hub+Screenshot)
- Full audit trail: every agent run, exact prompt sent, raw AI response, hours saved

---

## Competitive Advantage

| Feature | FounderOS | Notion | HubSpot | Linear | Monday |
|---|---|---|---|---|---|
| CRM | ✅ | Limited | ✅ | ❌ | Limited |
| Task Management | ✅ | ✅ | Basic | ✅ | ✅ |
| Meeting AI Extraction | ✅ | Partial | Partial | Partial | Partial |
| Startup KPI Dashboard | ✅ | Needs setup | Needs setup | ❌ | Needs setup |
| **Investor Updates** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AI Audit Trail** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Built for Early-Stage** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Getting Started

### Prerequisites

- Node.js 18+
- AWS account with Aurora PostgreSQL, Bedrock model access, S3 bucket, SES verified identity
- Google OAuth credentials
- Stripe account
- Vercel account

### 1. Clone and install

```bash
git clone https://github.com/yourusername/founderos
cd founderos
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

```env
# Aurora PostgreSQL (AWS RDS)
DATABASE_URL=postgresql://user:password@your-aurora-endpoint:5432/founderos?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AWS Services
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=
AWS_BEDROCK_REGION=us-east-1
AWS_SES_FROM_EMAIL=

# AI Fallback
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID_PRO=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Vercel Cron Security
CRON_SECRET=
```

### 3. Run the database schema

```bash
psql $DATABASE_URL -f db/schema.sql
```

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
vercel deploy
```

Add all environment variables in the Vercel dashboard. Cron jobs register automatically from `vercel.json`.

---

## AWS Setup Notes

**Aurora PostgreSQL Serverless v2**
AWS Console → RDS → Create Database → Aurora PostgreSQL Serverless v2. Enable public access. Security group: allow inbound TCP port 5432. Append `?sslmode=require` to connection string.

**AWS Bedrock**
AWS Console → Bedrock → Model Access → Request `anthropic.claude-sonnet-4-5` and `anthropic.claude-haiku-20240307`. Approval takes up to 24 hours — request immediately.

**AWS SES**
AWS Console → SES → Verified Identities → verify your sender email. New accounts are in sandbox mode — verify recipient emails during development.

**Amazon S3**
Create a private bucket. The app uses SDK operations only — no public bucket policy needed.

---

## Project Structure

```
founderos/
├── app/
│   ├── (auth)/
│   │   ├── login/              # Google OAuth sign in
│   │   └── onboarding/         # Workspace setup
│   ├── (dashboard)/
│   │   ├── page.tsx            # Main dashboard
│   │   ├── crm/                # CRM and pipeline kanban
│   │   ├── tasks/              # Task management
│   │   ├── kpis/               # Financial KPIs + anomaly chart
│   │   ├── meetings/           # Meeting notes + AI extraction
│   │   ├── investor-updates/   # AI drafting + SES delivery
│   │   ├── agents/             # Agent Hub + audit trail
│   │   └── settings/           # Workspace + billing + SES
│   └── api/
│       ├── auth/               # NextAuth handlers
│       ├── workspaces/         # All workspace API routes
│       ├── cron/               # Vercel cron job routes
│       └── webhooks/           # Stripe webhook
├── lib/
│   ├── agents/
│   │   ├── meeting-agent.ts        # Meeting Intelligence Agent
│   │   ├── investor-update-agent.ts # Investor Update Agent
│   │   ├── anomaly-agent.ts         # Revenue Anomaly Agent
│   │   └── sales-digest-agent.ts    # Sales Digest Agent
│   ├── db.ts                   # Aurora PostgreSQL client
│   ├── bedrock.ts              # AWS Bedrock client
│   ├── s3.ts                   # Amazon S3 client
│   ├── ses.ts                  # AWS SES client
│   └── auth.ts                 # NextAuth config
├── db/
│   └── schema.sql              # Aurora PostgreSQL schema (11 tables)
└── vercel.json                 # Cron job schedules
```

---

## Monetization

| Plan | Price | Features |
|---|---|---|
| **Free** | $0/month | 1 workspace, 50 contacts, manual agent runs |
| **Pro** | $49/month | Unlimited contacts, automated cron agents, SES email delivery, PDF export |

---

## IAM Policy Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:VerifyEmailIdentity"],
      "Resource": "*"
    }
  ]
}
```

---

## License

MIT

---

<div align="center">

Built for the **H0 Hackathon** · AWS Databases + Vercel · June 2026

[![AWS](https://img.shields.io/badge/Powered_by-AWS-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>
# founderos
