# Database

Supabase (PostgreSQL). Everything lives in `supabase/migrations`, applied in numeric order.
`supabase/schema.sql` is a consolidated copy of the same schema for bootstrapping a brand-new project.

## Applying

```bash
supabase link --project-ref <ref>      # once
supabase db push                       # applies any unapplied migrations
```

Migrations 001-021 were applied to the linked project earlier. **022, 023 and 024 must be pushed** before the
apps work: without them new sign-ups get no `clients` row, so they cannot submit requests or claims.

## First admin

Nobody can make themselves staff: roles are stored on `profiles.role`, sign-up metadata is ignored, and a
database trigger blocks non-admins from changing `role`, `is_active` or `email`. Create the first administrator
once, with elevated privileges:

1. Register normally in the client app (or invite the user in the Supabase dashboard).
2. In the Supabase SQL editor run:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

From then on that admin promotes advisers in the Royal Desk under **Settings → Team**
(`admin_set_user_role`). Staff sign in at the staff URL (`/7838bc41-d851-427a-8111-6797b789ec90`).
That path only selects the staff sign-in screen; it is not a security control.

After migrating an existing project, review who has elevated access:

```sql
select email, role from public.profiles where role <> 'client';
```

## Tables

| Area | Tables |
| --- | --- |
| People | `profiles` (1:1 with `auth.users`), `clients`, `dependants`, `beneficiaries` |
| Balance sheet | `assets`, `liabilities`, `income`, `expenses`, `policies`, `investments`, `goals` |
| Service | `requests`, `request_workflows`, `tasks`, `reminders`, `documents` |
| Claims | `claims`, `claim_timeline`, `claim_witnesses`, `claim_vehicles` |
| Communication | `notifications`, `messages`, `push_subscriptions` |
| Reference / audit | `providers`, `audit_logs` |

Every new auth user gets a `profiles` row (role `client`) and a `clients` row with a generated
`RSF-C-#####` number and the least-loaded adviser (migration 022).

## Row Level Security

Defined in one place, migration 023.

* **Clients** read only their own client file and everything hanging off it. They may edit their own name and
  phone, personal details (address, occupation, ID number...), goals, and upload documents into their own folder.
* **Staff** (`adviser`, `admin`, `compliance`) read every client and maintain balance-sheet data, documents,
  tasks and reminders.
* **Protected fields** (`role`, `is_active`, `email`, `adviser_id`, `client_number`, `risk_profile`,
  `onboarding_completed`, internal `notes`) can only be changed by staff/admin, enforced by triggers.
* Requests, claims and messages are **created only through functions** (below), never by direct insert.
* `claim_timeline` rows flagged `is_client_visible = false` are internal and invisible to clients.
* `audit_logs` is read-only for staff and written only by triggers.
* `anon` has no table access.

## Functions (RPC)

| Function | Caller | Purpose |
| --- | --- | --- |
| `create_client_request` | client | Creates a request, 4 workflow steps, an adviser task and notification |
| `create_motor_claim` | client | Creates a claim, first timeline entry, urgent adviser task and notification |
| `advance_request_workflow` | staff | Completes the current step, starts the next, completes the request at the end |
| `set_request_status` | staff | Park (waiting on client/provider), cancel or reopen |
| `update_claim_status` | staff | Moves a claim to a stage; a trigger writes the timeline entry and notifies the client |
| `complete_reminder` | staff | Completes a one-off reminder or rolls a recurring one to its next date |
| `process_due_reminders` | service role / cron | Notifies client and adviser about reminders due within 48 h (scheduled hourly if `pg_cron` is enabled) |
| `send_message` / `mark_thread_read` | both | One message thread per client |
| `admin_set_user_role` | admin | Promote/demote/deactivate users; hands over an ex-adviser's clients |
| `assign_client_adviser` | admin | Reassigns a client and their open work |
| `client_net_worth` | both | Assets + investments - liabilities |

## Triggers that keep both apps in step

* Request status change: notifies the client, stamps `completed_at`, completes/cancels linked tasks.
* Claim status change: stamps `closed_at`/`repair_authorised`, writes the client-visible timeline entry, notifies the client.
* Document uploaded: notifies the other party. Document verified: stamps `verified_by/at`, notifies the client.
* `updated_at` maintained on every table; row-level audit trail on all business tables.

## Storage

Private bucket `client-documents`, 10 MB limit, folder per client: `<client_id>/<timestamp>_<file name>`.
Storage policies derive the client from the first path segment, so a client can only read/write their own folder.

## Realtime

The tables above are added to the `supabase_realtime` publication; both apps subscribe and reload on any change,
so a request the client submits appears in the Royal Desk, and an adviser's update appears for the client, within a
second or so. Row Level Security still decides what each user receives.
