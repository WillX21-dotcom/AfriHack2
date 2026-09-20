# Database

Supabase (PostgreSQL). Everything lives in `supabase/migrations`, applied in numeric order.
`supabase/schema.sql` is a consolidated copy of the same schema for bootstrapping a brand-new project.

## Applying

```bash
supabase link --project-ref <ref>      # once
supabase db push                       # applies any unapplied migrations
```

Migrations 001-021 were applied to the linked project earlier. **022, 023, 024 and 025 must be pushed** before the
apps work: without them new sign-ups get no `clients` row, so they cannot submit requests or claims.

## Existing projects: legacy `trg_*` objects

A project that was set up by hand before these migrations may carry an older trigger layer. On the linked
project it had nine `trg_*` triggers (workflow-step creation, claim timeline and notification, request audit,
number generation, assignment notification, `protect_profile_fields` / `protect_client_fields`) and an old
4-argument `create_motor_claim`. They duplicate what migrations 023/024 now do, made request creation fail with a
duplicate-key error, and their protect triggers rejected the SQL editor, which blocked promoting the first admin.

Migration 023 (section 0) therefore **drops every trigger in `public` whose name starts with `trg_`** and the nine
matching legacy functions, and 024 drops the old `create_motor_claim` overload. It is a no-op on a clean project.
If you keep your own triggers in `public`, do not name them `trg_*`, or review section 0 before pushing.

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
| Service | `requests`, `request_workflows`, `tasks`, `reminders`, `documents`, `document_events` |
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
* Document processing (025): rejected -> client is told to re-upload; under review / escalated -> adviser is notified.
* `updated_at` maintained on every table; row-level audit trail on all business tables.

## Document processing (migration 025)

Uploads of `id_document` and `proof_of_address` go through the `process-document` edge function
(`supabase/functions/process-document`): extract fields with Gemini, apply the rules in
`packages/shared/src/rules/documentRules.ts`, then write the outcome. Everything else stays manual.

| Column on `documents` | Meaning |
| --- | --- |
| `processing_status` | `pending`, `processing`, `auto_completed`, `under_review`, `successful`, `rejected` |
| `confidence_score`, `extracted_fields` | OCR result (0-1 confidence; JSON of the fields the rules require) |
| `human_review_required`, `rejection_reason` | Why an adviser must look / why the upload failed |
| `reupload_count`, `escalated_at` | Earlier rejected uploads of the same type; set when the 5-re-upload limit is exhausted |

* `is_verified` is derived: `auto_completed` and `successful` set it, so FICA status and onboarding keep working.
  Toggling `is_verified` directly still works and moves the status with it.
* Clients cannot set any of these: an insert guard resets them for non-staff, and only staff / the service role can update.
* `document_events` is the append-only engine trace (`ocr_started`, `fields_extracted`, `rule_outcome`, adviser actions).
  Staff can insert their own actions; the edge function writes engine steps with the service role.
* Edge function secrets: `supabase secrets set GEMINI_API_KEY=...`, then `supabase functions deploy process-document`.

## Storage

Private bucket `client-documents`, 10 MB limit, folder per client: `<client_id>/<timestamp>_<file name>`.
Storage policies derive the client from the first path segment, so a client can only read/write their own folder.

## Realtime

The tables above are added to the `supabase_realtime` publication; both apps subscribe and reload on any change,
so a request the client submits appears in the Royal Desk, and an adviser's update appears for the client, within a
second or so. Row Level Security still decides what each user receives.
