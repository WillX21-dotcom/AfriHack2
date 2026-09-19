# Royal Square Financial Database Architecture

## Core Schema
The PostgreSQL schema consists of 25 relational tables, 15 custom ENUM types, and security definer functions executing Row Level Security (RLS).

### Tables
- `profiles`: User accounts extending `auth.users` with roles (`client`, `adviser`, `admin`, `compliance`).
- `clients`: Complete client KYC profiles, tax data, marital status, and assigned adviser.
- `dependants` & `beneficiaries`: Family linkages and percentage allocations.
- `assets`, `liabilities`, `income`, `expenses`: Client financial balance sheet.
- `providers`: Financial institutions (Sanlam, Old Mutual, Discovery, Santam, Allan Gray, etc.).
- `policies`: Active insurance policies and premiums.
- `investments`: Portfolios, funds, account balances, and contributions.
- `goals`: Structured savings and wealth goals with progress calculations.
- `documents`: Secure document metadata referencing Supabase Storage bucket `client-documents`.
- `requests`: Service requests with automated numbering (`RSF-YYYYMMDD-XXXXXX`).
- `request_workflows`: Multi-step audit timeline for requests.
- `claims`: Comprehensive motor and short-term insurance claims (`CLM-YYYYMMDD-XXXXXX`).
- `claim_timeline`: Client-visible and internal claim progress milestones.
- `claim_witnesses` & `claim_vehicles`: Incident evidence records.
- `tasks`: Adviser to-do items linked to clients, requests, or claims.
- `reminders`: Automated compliance and review reminders.
- `notifications`: Multi-channel in-app and push notifications.
- `messages`: Contextual communication threads linked to requests/claims.
- `audit_logs`: Immutable POPIA compliance audit trail.
