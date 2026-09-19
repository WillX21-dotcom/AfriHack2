# Royal Square Financial

Client portal and adviser operations desk for South African wealth management, short-term insurance claims and
compliance. Everything runs on **Supabase** (Auth, Postgres with Row Level Security, Storage, Realtime): there is
no demo or mock data, and the client app and the adviser dashboard render the same live records.

## What it does

* **Client PWA**: balance sheet and net worth, goals, service requests with a 4-step tracker, motor accident
  reporting (photos, voice statement, SAPS details), claim tracking, private document vault, messages,
  notifications and a real onboarding checklist.
* **Royal Desk (adviser/admin)**: practice overview, client 360 with balance-sheet capture, request and claim
  processing, tasks, reminders, documents, messaging, provider catalogue, analytics computed from live data,
  audit trail, and team/role management.

## Setup

```bash
npm install
cp .env.example .env        # then fill in your Supabase project URL and anon key
supabase link --project-ref <ref>
supabase db push            # applies migrations 001-024
npm run dev                 # http://localhost:3000
```

Then create your first administrator (see [docs/database.md](docs/database.md#first-admin)). Staff sign in at
`/7838bc41-d851-427a-8111-6797b789ec90`; clients register from the landing page.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |

## Docs

[Architecture](docs/architecture.md) · [Database](docs/database.md) · [API](docs/api.md) ·
[Workflows](docs/workflows.md) · [Security](docs/security.md)
