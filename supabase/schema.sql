-- =====================================================================================
-- Royal Square Financial - consolidated Supabase schema (greenfield reference)
--
-- Equivalent to running migrations 001-024 in order (021 is superseded by the RLS
-- section below). Safe to paste into the Supabase SQL editor on a NEW or EXISTING
-- project: it is idempotent, and it removes leftover trg_* triggers from older manual
-- set-ups that would otherwise clash with the workflow functions.
--
-- Contents
--   1. Profiles, roles, clients, dependants, beneficiaries
--   2. Financial data: assets, liabilities, income, expenses, policies, investments, goals
--   3. Documents, requests + workflow steps, claims (+timeline/witnesses/vehicles)
--   4. Tasks, reminders, notifications, messages, providers, audit log
--   5. Helper functions, auth provisioning trigger, RLS, audit + notification triggers,
--      storage bucket, realtime, workflow RPCs
-- =====================================================================================

-- ---- migrations/001_profiles.sql ----
-- Migration 001: Profiles and Enums
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do $$ begin
    create type public.user_role as enum ('client', 'adviser', 'admin', 'compliance');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    first_name text,
    last_name text,
    phone text,
    avatar_url text,
    role public.user_role not null default 'client',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- ---- migrations/002_clients.sql ----
-- Migration 002: Clients
create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid unique not null references public.profiles(id) on delete cascade,
    client_number text unique,
    id_number text,
    date_of_birth date,
    nationality text,
    marital_status text,
    occupation text,
    employer text,
    address_line_1 text,
    address_line_2 text,
    city text,
    province text,
    postal_code text,
    country text default 'South Africa',
    preferred_contact_method text check (preferred_contact_method is null or preferred_contact_method in ('app','email','phone')),
    risk_profile text,
    adviser_id uuid references public.profiles(id) on delete set null,
    onboarding_completed boolean not null default false,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_clients_profile on public.clients(profile_id);
create index if not exists idx_clients_adviser on public.clients(adviser_id);
create index if not exists idx_clients_number on public.clients(client_number);

-- ---- migrations/003_dependants.sql ----
-- Migration 003: Dependants and Beneficiaries
create table if not exists public.dependants (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    full_name text not null,
    relationship text,
    date_of_birth date,
    id_number text,
    is_dependent boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_dependants_client on public.dependants(client_id);

create table if not exists public.beneficiaries (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    full_name text not null,
    relationship text,
    id_number text,
    date_of_birth date,
    percentage numeric(5,2) check (percentage >= 0 and percentage <= 100),
    contact_number text,
    email text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_beneficiaries_client on public.beneficiaries(client_id);

-- ---- migrations/004_financials.sql ----
-- Migration 004: Financials (Assets, Liabilities, Income, Expenses, View)
do $$ begin
    create type public.asset_type as enum ('property', 'vehicle', 'investment', 'cash', 'business', 'pension', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.liability_type as enum ('bond', 'vehicle_finance', 'personal_loan', 'credit_card', 'business_loan', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists public.assets (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    asset_type public.asset_type not null,
    name text not null,
    description text,
    current_value numeric(15,2) not null default 0 check (current_value >= 0),
    institution text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_assets_client on public.assets(client_id);

create table if not exists public.liabilities (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    liability_type public.liability_type not null,
    name text not null,
    institution text,
    outstanding_balance numeric(15,2) not null default 0 check (outstanding_balance >= 0),
    monthly_payment numeric(15,2) not null default 0 check (monthly_payment >= 0),
    interest_rate numeric(8,4),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_liabilities_client on public.liabilities(client_id);

create table if not exists public.income (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    source text not null,
    amount numeric(15,2) not null default 0 check (amount >= 0),
    frequency text not null default 'monthly',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_income_client on public.income(client_id);

create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    category text not null,
    amount numeric(15,2) not null default 0 check (amount >= 0),
    frequency text not null default 'monthly',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_expenses_client on public.expenses(client_id);

-- ---- migrations/005_policies.sql ----
-- Migration 005: Policies
create table if not exists public.policies (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    provider_id uuid,
    policy_number text,
    policy_type text,
    premium numeric(15,2) not null default 0 check (premium >= 0),
    premium_frequency text default 'monthly',
    sum_assured numeric(15,2) not null default 0 check (sum_assured >= 0),
    status text not null default 'active',
    start_date date,
    renewal_date date,
    debit_order_day integer check (debit_order_day is null or debit_order_day between 1 and 31),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_policies_client on public.policies(client_id);
create index if not exists idx_policies_renewal on public.policies(renewal_date);

-- ---- migrations/006_investments.sql ----
-- Migration 006: Investments
create table if not exists public.investments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    provider_id uuid,
    investment_name text not null,
    account_number text,
    current_value numeric(15,2) not null default 0 check (current_value >= 0),
    monthly_contribution numeric(15,2) not null default 0 check (monthly_contribution >= 0),
    investment_type text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_investments_client on public.investments(client_id);

-- ---- migrations/007_goals.sql ----
-- Migration 007: Goals
do $$ begin
    create type public.goal_status as enum ('active', 'achieved', 'paused', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.goal_type as enum ('retirement', 'property', 'vehicle', 'education', 'emergency_fund', 'travel', 'investment', 'business', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    name text not null,
    goal_type public.goal_type not null default 'other',
    description text,
    target_amount numeric(15,2) not null check (target_amount >= 0),
    current_amount numeric(15,2) not null default 0 check (current_amount >= 0),
    target_date date,
    status public.goal_status not null default 'active',
    is_shared boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_goals_client on public.goals(client_id);

-- ---- migrations/008_documents.sql ----
-- Migration 008: Documents
do $$ begin
    create type public.document_type as enum (
        'id_document', 'proof_of_address', 'policy_document', 'investment_statement',
        'driver_license', 'vehicle_registration', 'insurance_certificate', 'claim_document',
        'financial_statement', 'beneficiary_document', 'compliance_document', 'other'
    );
exception when duplicate_object then null;
end $$;

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    uploaded_by uuid references public.profiles(id) on delete set null,
    document_type public.document_type not null,
    name text not null,
    storage_path text not null,
    mime_type text,
    file_size bigint check (file_size is null or file_size >= 0),
    is_verified boolean not null default false,
    verified_by uuid references public.profiles(id) on delete set null,
    verified_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_documents_client on public.documents(client_id);
create index if not exists idx_documents_type on public.documents(document_type);

-- ---- migrations/009_requests.sql ----
-- Migration 009: Requests
do $$ begin
    create type public.request_status as enum ('draft', 'submitted', 'in_progress', 'waiting_client', 'waiting_provider', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.request_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.request_type as enum (
        'change_address', 'change_bank_details', 'change_beneficiary', 'policy_document',
        'border_letter', 'irps', 'consultation', 'client_information', 'balance_sheet',
        'income_statement', 'driver_license', 'insurance_certificate', 'policy_change',
        'investment_request', 'general'
    );
exception when duplicate_object then null;
end $$;

create table if not exists public.requests (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete set null,
    assigned_to uuid references public.profiles(id) on delete set null,
    request_number text unique,
    request_type public.request_type not null,
    title text not null,
    description text,
    status public.request_status not null default 'submitted',
    priority public.request_priority not null default 'normal',
    due_date timestamptz,
    completed_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_requests_client on public.requests(client_id);
create index if not exists idx_requests_status on public.requests(status);
create index if not exists idx_requests_assigned on public.requests(assigned_to);
create index if not exists idx_requests_created on public.requests(created_at desc);

-- ---- migrations/010_workflows.sql ----
-- Migration 010: Request Workflows
create table if not exists public.request_workflows (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references public.requests(id) on delete cascade,
    step_number integer not null,
    step_key text not null,
    step_name text not null,
    status text not null default 'pending',
    started_at timestamptz,
    completed_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(request_id, step_number)
);

create index if not exists idx_request_workflows_request on public.request_workflows(request_id);

-- ---- migrations/011_claims.sql ----
-- Migration 011: Claims, Timeline, Witnesses, Vehicles
do $$ begin
    create type public.claim_type as enum ('motor', 'home', 'life', 'travel', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.claim_status as enum (
        'draft', 'reported', 'submitted', 'insurer_received', 'handler_assigned',
        'assessment_pending', 'assessment_complete', 'quotes_pending',
        'authorisation_pending', 'authorised', 'repair_booked', 'repair_in_progress',
        'vehicle_ready', 'hire_car_returned', 'completed', 'rejected', 'cancelled'
    );
exception when duplicate_object then null;
end $$;

create table if not exists public.claims (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete set null,
    assigned_to uuid references public.profiles(id) on delete set null,
    provider_id uuid,
    claim_number text unique,
    claim_type public.claim_type not null default 'motor',
    status public.claim_status not null default 'draft',
    incident_date timestamptz,
    incident_location text,
    incident_description text,
    police_reported boolean not null default false,
    police_case_number text,
    police_station text,
    insurer_reference text,
    handler_name text,
    handler_contact text,
    assessment_date timestamptz,
    repair_authorised boolean not null default false,
    repair_date timestamptz,
    hire_car_required boolean not null default false,
    hire_car_provider text,
    hire_car_start timestamptz,
    hire_car_end timestamptz,
    closed_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_claims_client on public.claims(client_id);
create index if not exists idx_claims_status on public.claims(status);

create table if not exists public.claim_timeline (
    id uuid primary key default gen_random_uuid(),
    claim_id uuid not null references public.claims(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete set null,
    status public.claim_status,
    title text not null,
    description text,
    is_client_visible boolean not null default true,
    created_at timestamptz not null default now()
);
create index if not exists idx_claim_timeline_claim on public.claim_timeline(claim_id);

create table if not exists public.claim_witnesses (
    id uuid primary key default gen_random_uuid(),
    claim_id uuid not null references public.claims(id) on delete cascade,
    full_name text,
    phone text,
    email text,
    address text,
    statement text,
    voice_note_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.claim_vehicles (
    id uuid primary key default gen_random_uuid(),
    claim_id uuid not null references public.claims(id) on delete cascade,
    is_client_vehicle boolean not null default false,
    registration_number text,
    make text,
    model text,
    year integer check (year is null or year between 1886 and 2100),
    driver_name text,
    driver_license_number text,
    owner_name text,
    insurer_name text,
    policy_number text,
    damage_description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---- migrations/012_tasks.sql ----
-- Migration 012: Tasks
do $$ begin
    create type public.task_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete cascade,
    assigned_to uuid references public.profiles(id) on delete set null,
    request_id uuid references public.requests(id) on delete cascade,
    claim_id uuid references public.claims(id) on delete cascade,
    title text not null,
    description text,
    status public.task_status not null default 'pending',
    priority public.request_priority not null default 'normal',
    due_date timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_tasks_client on public.tasks(client_id);
create index if not exists idx_tasks_status on public.tasks(status);

-- ---- migrations/013_reminders.sql ----
-- Migration 013: Reminders
do $$ begin
    create type public.reminder_frequency as enum ('once', 'monthly', 'quarterly', 'six_monthly', 'yearly', 'every_two_years');
exception when duplicate_object then null;
end $$;

create table if not exists public.reminders (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete set null,
    title text not null,
    description text,
    reminder_date timestamptz not null,
    frequency public.reminder_frequency not null default 'once',
    is_completed boolean not null default false,
    notify_client boolean not null default true,
    notify_adviser boolean not null default true,
    related_document_id uuid references public.documents(id) on delete set null,
    related_policy_id uuid references public.policies(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_reminders_client on public.reminders(client_id);
create index if not exists idx_reminders_date on public.reminders(reminder_date);

-- ---- migrations/014_notifications.sql ----
-- Migration 014: Notifications & Push Subscriptions
do $$ begin
    create type public.notification_type as enum ('request', 'claim', 'reminder', 'document', 'message', 'goal', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.notification_channel as enum ('in_app', 'push', 'email');
exception when duplicate_object then null;
end $$;

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    notification_type public.notification_type not null,
    channel public.notification_channel not null default 'in_app',
    title text not null,
    body text,
    request_id uuid references public.requests(id) on delete cascade,
    claim_id uuid references public.claims(id) on delete cascade,
    reminder_id uuid references public.reminders(id) on delete cascade,
    document_id uuid references public.documents(id) on delete cascade,
    is_read boolean not null default false,
    read_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    endpoint text not null unique,
    p256dh text,
    auth_key text,
    user_agent text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---- migrations/015_messages.sql ----
-- Migration 015: Messages
do $$ begin
    create type public.message_direction as enum ('client_to_royal', 'royal_to_client');
exception when duplicate_object then null;
end $$;

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,
    recipient_id uuid references public.profiles(id) on delete cascade,
    request_id uuid references public.requests(id) on delete cascade,
    claim_id uuid references public.claims(id) on delete cascade,
    direction public.message_direction not null,
    subject text,
    body text not null,
    attachment_path text,
    is_read boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_messages_client on public.messages(client_id);
create index if not exists idx_messages_request on public.messages(request_id);
create index if not exists idx_messages_claim on public.messages(claim_id);
create index if not exists idx_messages_created on public.messages(created_at desc);

-- ---- migrations/016_providers.sql ----
-- Migration 016: Providers
create table if not exists public.providers (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    provider_type text not null,
    api_enabled boolean not null default false,
    mock_enabled boolean not null default true,
    contact_email text,
    contact_phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into public.providers (name, provider_type, api_enabled, mock_enabled, contact_email)
values
    ('Sanlam', 'insurance_and_investments', false, true, 'mock@sanlam.example'),
    ('Old Mutual', 'insurance_and_investments', false, true, 'mock@oldmutual.example'),
    ('Liberty', 'insurance_and_investments', false, true, 'mock@liberty.example'),
    ('Momentum', 'insurance_and_investments', false, true, 'mock@momentum.example'),
    ('Discovery', 'insurance_and_investments', false, true, 'mock@discovery.example'),
    ('Allan Gray', 'investments', false, true, 'mock@allangray.example'),
    ('Santam', 'insurance', false, true, 'mock@santam.example')
on conflict (name) do update set mock_enabled = true;

-- ---- migrations/017_audit_logs.sql ----
-- Migration 017: Audit Logs
do $$ begin
    create type public.audit_action as enum (
        'create', 'update', 'delete', 'login', 'logout', 'upload',
        'download', 'status_change', 'assign', 'complete'
    );
exception when duplicate_object then null;
end $$;

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    action public.audit_action not null,
    table_name text,
    record_id uuid,
    description text,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_record on public.audit_logs(record_id);

-- ---- migrations/018_rls.sql ----
-- Migration 018: Row Level Security Policies
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.dependants enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.providers enable row level security;
alter table public.policies enable row level security;
alter table public.investments enable row level security;
alter table public.goals enable row level security;
alter table public.documents enable row level security;
alter table public.requests enable row level security;
alter table public.request_workflows enable row level security;
alter table public.claims enable row level security;
alter table public.claim_timeline enable row level security;
alter table public.claim_witnesses enable row level security;
alter table public.claim_vehicles enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.push_subscriptions enable row level security;

-- ---- migrations/019_functions.sql ----
-- Migration 019: Stored Procedures, Functions, and Triggers
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
    select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_client_id()
returns uuid
language sql stable security definer set search_path = public as $$
    select id from public.clients where profile_id = auth.uid() limit 1;
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid()
          and role in ('adviser', 'admin', 'compliance')
          and is_active = true
    );
$$;

create or replace function public.goal_progress(p_goal_id uuid)
returns numeric
language sql stable security definer set search_path = public as $$
    select
        case
            when target_amount <= 0 then 0
            else least(100, round((current_amount / target_amount) * 100, 2))
        end
    from public.goals where id = p_goal_id;
$$;

create or replace function public.client_net_worth(p_client_id uuid)
returns numeric
language sql stable security definer set search_path = public as $$
    select
        coalesce((select sum(current_value) from public.assets where client_id = p_client_id), 0)
        + coalesce((select sum(current_value) from public.investments where client_id = p_client_id), 0)
        - coalesce((select sum(outstanding_balance) from public.liabilities where client_id = p_client_id), 0);
$$;

create or replace function public.create_client_request(
    p_request_type public.request_type,
    p_title text,
    p_description text default null,
    p_priority public.request_priority default 'normal',
    p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
    v_client_id uuid;
    v_request_id uuid;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    insert into public.requests (
        client_id, created_by, request_type, title, description, status, priority, metadata
    ) values (
        v_client_id, auth.uid(), p_request_type, p_title, p_description, 'submitted', p_priority, coalesce(p_metadata, '{}'::jsonb)
    ) returning id into v_request_id;

    return v_request_id;
end;
$$;

create or replace function public.create_motor_claim(
    p_incident_date timestamptz,
    p_incident_location text,
    p_incident_description text,
    p_provider_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
    v_client_id uuid;
    v_claim_id uuid;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    insert into public.claims (
        client_id, created_by, provider_id, claim_type, status, incident_date, incident_location, incident_description
    ) values (
        v_client_id, auth.uid(), p_provider_id, 'motor', 'reported', p_incident_date, p_incident_location, p_incident_description
    ) returning id into v_claim_id;

    return v_claim_id;
end;
$$;

create or replace function public.update_claim_status(
    p_claim_id uuid,
    p_status public.claim_status,
    p_description text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may update claim status';
    end if;

    update public.claims
    set status = p_status,
        metadata = coalesce(metadata, '{}'::jsonb) ||
            case when p_description is not null then jsonb_build_object('latest_status_description', p_description) else '{}'::jsonb end,
        updated_at = now()
    where id = p_claim_id;
end;
$$;

-- ---- migrations/020_real_workflows.sql ----
-- Migration 020: Real client/admin workflow contracts

create or replace function public.create_client_request(
    p_request_type public.request_type,
    p_title text,
    p_description text default null,
    p_priority public.request_priority default 'normal',
    p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client_id uuid;
    v_request_id uuid;
    v_assigned_to uuid;
    v_request_number text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    select id into v_assigned_to
    from public.profiles
    where role in ('adviser', 'admin') and is_active = true
    order by role, created_at
    limit 1;

    v_request_number := 'RSF-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    insert into public.requests (
        client_id, created_by, assigned_to, request_number, request_type,
        title, description, status, priority, due_date, metadata
    ) values (
        v_client_id, auth.uid(), v_assigned_to, v_request_number, p_request_type,
        p_title, p_description, 'submitted', p_priority, now() + interval '3 days', coalesce(p_metadata, '{}'::jsonb)
    ) returning id into v_request_id;

    insert into public.request_workflows (request_id, step_number, step_key, step_name, status, started_at, completed_at)
    values
      (v_request_id, 1, 'submitted', 'Request submitted', 'completed', now(), now()),
      (v_request_id, 2, 'review', 'Royal Square review', 'pending', null, null),
      (v_request_id, 3, 'processing', 'Processing with provider', 'pending', null, null),
      (v_request_id, 4, 'complete', 'Completed', 'pending', null, null);

    if v_assigned_to is not null then
      insert into public.notifications (user_id, notification_type, channel, title, body, request_id)
      values (v_assigned_to, 'request', 'in_app', 'New service request', p_title, v_request_id);
    end if;

    return v_request_id;
end;
$$;

grant execute on function public.create_client_request(public.request_type, text, text, public.request_priority, jsonb) to authenticated;

create or replace function public.create_motor_claim(
    p_incident_date timestamptz,
    p_incident_location text,
    p_incident_description text,
    p_police_case_number text default null,
    p_police_station text default null,
    p_provider_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client_id uuid;
    v_claim_id uuid;
    v_assigned_to uuid;
    v_claim_number text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    select id into v_assigned_to
    from public.profiles
    where role in ('adviser', 'admin') and is_active = true
    order by role, created_at
    limit 1;

    v_claim_number := 'CLM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    insert into public.claims (
        client_id, created_by, assigned_to, provider_id, claim_number, claim_type,
        status, incident_date, incident_location, incident_description,
        police_reported, police_case_number, police_station
    ) values (
        v_client_id, auth.uid(), v_assigned_to, p_provider_id, v_claim_number, 'motor',
        'reported', p_incident_date, p_incident_location, p_incident_description,
        p_police_case_number is not null, p_police_case_number, p_police_station
    ) returning id into v_claim_id;

    insert into public.claim_timeline (claim_id, created_by, status, title, description, is_client_visible)
    values (v_claim_id, auth.uid(), 'reported', 'Accident reported', p_incident_description, true);

    if v_assigned_to is not null then
      insert into public.notifications (user_id, notification_type, channel, title, body, claim_id)
      values (v_assigned_to, 'claim', 'in_app', 'New motor claim reported', v_claim_number, v_claim_id);
    end if;

    return v_claim_id;
end;
$$;

grant execute on function public.create_motor_claim(timestamptz, text, text, text, text, uuid) to authenticated;

-- ---- can_access_client (from 021; the rest of 021 is replaced by 023) ----
create or replace function public.can_access_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (select 1 from public.clients where id = p_client_id and profile_id = auth.uid());
$$;
grant execute on function public.can_access_client(uuid) to authenticated;

-- ---- migrations/022_auth_profiles.sql ----
-- Migration 022: Provision an application profile + client record for every Supabase Auth user.
--
-- SECURITY: the role is NEVER read from sign-up metadata or the email address. Every new account
-- starts as a 'client'. Staff roles are granted by an existing admin (see 024_workflow_functions.sql,
-- admin_set_user_role) or by SQL run with elevated privileges (see docs/database.md, "First admin").

create sequence if not exists public.client_number_seq start with 10001;

create or replace function public.next_client_number()
returns text
language sql
volatile
set search_path = public
as $$
  select 'RSF-C-' || nextval('public.client_number_seq')::text;
$$;

-- Least-loaded active adviser (admins are only used when no adviser exists).
create or replace function public.pick_default_adviser()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.is_active and p.role in ('adviser', 'admin')
  order by
    (p.role = 'admin'),
    (select count(*) from public.clients c where c.adviser_id = p.id),
    p.created_at
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_last text;
begin
  v_first := coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(new.email, ''), '@', 1));
  v_last := coalesce(trim(new.raw_user_meta_data ->> 'last_name'), '');

  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (new.id, new.email, v_first, v_last, nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 'client')
  on conflict (id) do update set email = excluded.email, updated_at = now();

  insert into public.clients (profile_id, client_number, adviser_id, preferred_contact_method)
  values (new.id, public.next_client_number(), public.pick_default_adviser(), 'app')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep the public profile email in step with auth.users.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.handle_user_email_change();

-- Backfill: accounts created before this trigger existed have no profile / client record.
-- Everyone is backfilled as a plain client; promote staff afterwards.
insert into public.profiles (id, email, first_name, last_name, role)
select
  u.id,
  u.email,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(u.email, ''), '@', 1)),
  coalesce(trim(u.raw_user_meta_data ->> 'last_name'), ''),
  'client'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.clients (profile_id, client_number, adviser_id, preferred_contact_method)
select p.id, public.next_client_number(), public.pick_default_adviser(), 'app'
from public.profiles p
where p.role = 'client'
  and not exists (select 1 from public.clients c where c.profile_id = p.id);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.next_client_number() from public, anon, authenticated;
revoke execute on function public.pick_default_adviser() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

-- ---- migrations/023_security_and_schema.sql ----
-- Migration 023: Schema corrections, hardened RLS, server-side auditing, notifications, storage, realtime.
--
-- This migration is the single source of truth for Row Level Security: it drops every existing
-- policy in the public schema (021 mixed two overlapping generations of policies, some of which
-- allowed clients to insert requests directly and to read internal claim timeline entries) and
-- recreates the complete set.

-- ---------------------------------------------------------------------------------------------
-- 0. Remove objects left behind by earlier manual set-ups
-- ---------------------------------------------------------------------------------------------
-- An older hand-written layer (triggers named trg_*) overlaps this schema: it creates the same
-- request workflow steps (so create_client_request() hit the unique(request_id, step_number) key),
-- writes duplicate claim timeline / notification / audit rows, and its protect_* triggers reject the
-- SQL editor (no signed-in user) so an administrator could never be bootstrapped. guard_profile_update
-- and guard_client_update below replace the protect_* triggers. Nothing here matches the triggers
-- this schema creates (none of them start with "trg_"), and dropping is a no-op on a clean project.
do $$
declare
  r record;
begin
  for r in
    select c.relname as tbl, t.tgname as trg
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and not t.tgisinternal and t.tgname like 'trg\_%' escape '\'
  loop
    execute format('drop trigger if exists %I on public.%I', r.trg, r.tbl);
  end loop;
end $$;

drop function if exists public.protect_profile_fields();
drop function if exists public.protect_client_fields();
drop function if exists public.add_claim_status_timeline();
drop function if exists public.notify_claim_update();
drop function if exists public.audit_request_changes();
drop function if exists public.initialize_request_workflow();
drop function if exists public.notify_request_assignment();
drop function if exists public.generate_claim_number();
drop function if exists public.generate_request_number();

-- ---------------------------------------------------------------------------------------------
-- 1. Schema corrections
-- ---------------------------------------------------------------------------------------------

-- Per-client audit trail (used by the adviser dashboard client 360 view). Deliberately NOT a foreign
-- key: audit records must outlive the client record they describe.
alter table public.audit_logs add column if not exists client_id uuid;
create index if not exists idx_audit_logs_client on public.audit_logs(client_id);

-- Claim repairer shown to both the client and the adviser.
alter table public.claims add column if not exists repairer_name text;

-- Documents can be attached to the request / claim they were produced for.
alter table public.documents add column if not exists request_id uuid references public.requests(id) on delete set null;
alter table public.documents add column if not exists claim_id uuid references public.claims(id) on delete set null;
create index if not exists idx_documents_request on public.documents(request_id);
create index if not exists idx_documents_claim on public.documents(claim_id);

-- Reminders: completion time + de-duplication of due notifications.
alter table public.reminders add column if not exists completed_at timestamptz;
alter table public.reminders add column if not exists last_notified_at timestamptz;

create index if not exists idx_notifications_created on public.notifications(user_id, created_at desc);

-- Provider references were plain uuids with no integrity. NOT VALID enforces the FK for new rows
-- without failing on any pre-existing rows.
do $$ begin
  alter table public.policies add constraint policies_provider_fk foreign key (provider_id) references public.providers(id) on delete set null not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.investments add constraint investments_provider_fk foreign key (provider_id) references public.providers(id) on delete set null not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.claims add constraint claims_provider_fk foreign key (provider_id) references public.providers(id) on delete set null not valid;
exception when duplicate_object then null; end $$;

-- 016 seeded placeholder "mock@..." contact addresses. Providers are a real, adviser-maintained catalogue.
update public.providers set contact_email = null where contact_email like 'mock@%.example';

-- ---------------------------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- Uniform updated_at maintenance (clients used to set this themselves).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select c.table_name
    from information_schema.columns c
    join pg_tables pt on pt.schemaname = c.table_schema and pt.tablename = c.table_name
    where c.table_schema = 'public' and c.column_name = 'updated_at'
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- 3. Privilege-escalation guards
-- ---------------------------------------------------------------------------------------------

-- A user may edit their own name / phone / avatar, but never their role, status or email.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role, the SQL editor and GoTrue-initiated changes.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.email is distinct from old.email then
    raise exception 'Role, status and email can only be changed by an administrator' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
for each row execute function public.guard_profile_update();

-- Clients may maintain their own personal details, but not who their adviser is, their client
-- number, risk profile, internal notes or onboarding sign-off.
create or replace function public.guard_client_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id
     or new.client_number is distinct from old.client_number
     or new.adviser_id is distinct from old.adviser_id
     or new.risk_profile is distinct from old.risk_profile
     or new.onboarding_completed is distinct from old.onboarding_completed
     or new.notes is distinct from old.notes then
    raise exception 'Adviser-managed client fields cannot be changed by the client' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_client_update on public.clients;
create trigger guard_client_update before update on public.clients
for each row execute function public.guard_client_update();

-- ---------------------------------------------------------------------------------------------
-- 4. Row Level Security (complete policy set)
-- ---------------------------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.dependants enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.providers enable row level security;
alter table public.policies enable row level security;
alter table public.investments enable row level security;
alter table public.goals enable row level security;
alter table public.documents enable row level security;
alter table public.requests enable row level security;
alter table public.request_workflows enable row level security;
alter table public.claims enable row level security;
alter table public.claim_timeline enable row level security;
alter table public.claim_witnesses enable row level security;
alter table public.claim_vehicles enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profiles & clients
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy clients_select on public.clients for select to authenticated
  using (profile_id = auth.uid() or public.is_staff());
create policy clients_update on public.clients for update to authenticated
  using (profile_id = auth.uid() or public.is_staff())
  with check (profile_id = auth.uid() or public.is_staff());

-- Balance sheet, cover and family records: clients read, staff maintain.
do $$
declare
  t text;
begin
  foreach t in array array['dependants', 'beneficiaries', 'assets', 'liabilities', 'income', 'expenses', 'policies', 'investments'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.can_access_client(client_id))', t || '_select', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t || '_staff_write', t);
  end loop;
end $$;

-- Goals: clients manage their own, staff can manage any.
create policy goals_select on public.goals for select to authenticated
  using (public.can_access_client(client_id));
create policy goals_write on public.goals for all to authenticated
  using (client_id = public.current_client_id() or public.is_staff())
  with check (client_id = public.current_client_id() or public.is_staff());

-- Documents: owner or staff may upload (into their own client folder); only staff verify / remove.
create policy documents_select on public.documents for select to authenticated
  using (public.can_access_client(client_id));
create policy documents_insert on public.documents for insert to authenticated
  with check (public.can_access_client(client_id) and uploaded_by = auth.uid());
create policy documents_staff_update on public.documents for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy documents_staff_delete on public.documents for delete to authenticated
  using (public.is_staff());

-- Requests: created only through create_client_request(); staff progress them.
create policy requests_select on public.requests for select to authenticated
  using (public.can_access_client(client_id));
create policy requests_staff_update on public.requests for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy request_workflows_select on public.request_workflows for select to authenticated
  using (exists (select 1 from public.requests r where r.id = request_id and public.can_access_client(r.client_id)));
create policy request_workflows_staff_update on public.request_workflows for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Claims: created only through create_motor_claim(); staff progress them.
create policy claims_select on public.claims for select to authenticated
  using (public.can_access_client(client_id));
create policy claims_staff_update on public.claims for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Clients only see timeline entries flagged client-visible; staff see everything.
create policy claim_timeline_select on public.claim_timeline for select to authenticated
  using (
    public.is_staff()
    or (is_client_visible and exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)))
  );
create policy claim_timeline_staff_insert on public.claim_timeline for insert to authenticated
  with check (public.is_staff());

create policy claim_witnesses_select on public.claim_witnesses for select to authenticated
  using (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_witnesses_insert on public.claim_witnesses for insert to authenticated
  with check (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_witnesses_staff_write on public.claim_witnesses for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy claim_vehicles_select on public.claim_vehicles for select to authenticated
  using (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_vehicles_insert on public.claim_vehicles for insert to authenticated
  with check (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_vehicles_staff_write on public.claim_vehicles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Staff work queues. Clients can read reminders that are flagged for them.
create policy tasks_staff_all on public.tasks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy reminders_staff_all on public.reminders for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy reminders_client_select on public.reminders for select to authenticated
  using (notify_client and client_id = public.current_client_id());

-- Notifications belong to the recipient; they may only flip the read flag (column grant below).
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Messages are one thread per client; writes go through send_message().
create policy messages_select on public.messages for select to authenticated
  using (public.can_access_client(client_id));

-- Provider catalogue: everyone signed in reads, staff maintain.
create policy providers_select on public.providers for select to authenticated using (true);
create policy providers_staff_update on public.providers for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy providers_admin_insert on public.providers for insert to authenticated
  with check (public.is_admin());

-- Audit trail: staff read only. Rows are written exclusively by SECURITY DEFINER triggers.
create policy audit_logs_staff_select on public.audit_logs for select to authenticated
  using (public.is_staff());

create policy push_subscriptions_own on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Table privileges: nothing for anon; narrow write access where policies alone are too coarse.
revoke all on all tables in schema public from anon;
revoke insert, update, delete, truncate on public.audit_logs from authenticated;
revoke update on public.notifications from authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 5. Tamper-resistant audit trail (server side, replaces client-side logging)
-- ---------------------------------------------------------------------------------------------

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
  v_action public.audit_action;
  v_id uuid;
  v_client uuid;
  v_label text;
  v_desc text;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_row := v_new;
    v_action := case when tg_table_name = 'documents' then 'upload' else 'create' end;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_row := v_new;
    -- updated_at churn alone is not an auditable change
    if (v_old - 'updated_at') = (v_new - 'updated_at') then
      return null;
    end if;
    v_action := case when v_old ->> 'status' is distinct from v_new ->> 'status' then 'status_change' else 'update' end;
  else
    v_old := to_jsonb(old);
    v_row := v_old;
    v_action := 'delete';
  end if;

  v_id := nullif(v_row ->> 'id', '')::uuid;
  v_client := case when tg_table_name = 'clients' then v_id else nullif(v_row ->> 'client_id', '')::uuid end;
  v_label := coalesce(v_row ->> 'request_number', v_row ->> 'claim_number', v_row ->> 'client_number', v_row ->> 'name', v_row ->> 'title', v_row ->> 'email', '');

  if v_action = 'status_change' then
    v_desc := format('%s %s: status %s -> %s', tg_table_name, v_label, v_old ->> 'status', v_new ->> 'status');
  else
    v_desc := format('%s %s %s', tg_table_name, lower(tg_op), v_label);
  end if;

  insert into public.audit_logs (user_id, action, table_name, record_id, client_id, description, old_data, new_data)
  values (auth.uid(), v_action, tg_table_name, v_id, v_client, trim(v_desc), v_old, v_new);

  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'clients', 'requests', 'claims', 'documents', 'reminders', 'tasks', 'goals',
    'policies', 'investments', 'assets', 'liabilities', 'income', 'expenses', 'dependants', 'beneficiaries'
  ] loop
    execute format('drop trigger if exists audit_row_change on public.%I', t);
    execute format('create trigger audit_row_change after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- 6. Lifecycle triggers: keep client and adviser views consistent and notify the other side
-- ---------------------------------------------------------------------------------------------

-- Requests: stamp completion, tidy tasks, tell the client.
create or replace function public.requests_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'completed' then
      new.completed_at := coalesce(new.completed_at, now());
    else
      new.completed_at := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists requests_before_update on public.requests;
create trigger requests_before_update before update on public.requests
for each row execute function public.requests_before_update();

create or replace function public.requests_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
begin
  select profile_id into v_profile from public.clients where id = new.client_id;

  if v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, request_id)
    values (
      v_profile, 'request', 'in_app',
      format('Request %s: %s', coalesce(new.request_number, ''), initcap(replace(new.status::text, '_', ' '))),
      new.title,
      new.id
    );
  end if;

  if new.status in ('completed', 'cancelled') then
    update public.tasks
    set status = case when new.status = 'completed' then 'completed'::public.task_status else 'cancelled'::public.task_status end,
        completed_at = now()
    where request_id = new.id and status in ('pending', 'in_progress');
  end if;

  return null;
end;
$$;

drop trigger if exists requests_after_status_change on public.requests;
create trigger requests_after_status_change after update of status on public.requests
for each row when (old.status is distinct from new.status)
execute function public.requests_after_status_change();

-- Claims: stamp closure / authorisation, write the client-visible timeline entry, tell the client.
create or replace function public.claims_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('completed', 'rejected', 'cancelled') then
      new.closed_at := coalesce(new.closed_at, now());
    else
      new.closed_at := null;
    end if;
    if new.status = 'authorised' then
      new.repair_authorised := true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists claims_before_update on public.claims;
create trigger claims_before_update before update on public.claims
for each row execute function public.claims_before_update();

create or replace function public.claims_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_note text;
  v_label text;
begin
  v_note := nullif(trim(coalesce(current_setting('rsf.status_note', true), '')), '');
  v_label := initcap(replace(new.status::text, '_', ' '));

  insert into public.claim_timeline (claim_id, created_by, status, title, description, is_client_visible)
  values (new.id, auth.uid(), new.status, 'Claim status: ' || v_label, coalesce(v_note, 'Status updated by Royal Square.'), true);

  select profile_id into v_profile from public.clients where id = new.client_id;
  if v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, claim_id)
    values (
      v_profile, 'claim', 'in_app',
      format('Claim %s: %s', coalesce(new.claim_number, ''), v_label),
      coalesce(v_note, 'Your claim has moved to a new stage.'),
      new.id
    );
  end if;

  return null;
end;
$$;

drop trigger if exists claims_after_status_change on public.claims;
create trigger claims_after_status_change after update of status on public.claims
for each row when (old.status is distinct from new.status)
execute function public.claims_after_status_change();

-- Documents: stamp verification, and tell the other party about new / verified documents.
create or replace function public.documents_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.is_verified is distinct from old.is_verified then
    if new.is_verified then
      new.verified_by := coalesce(auth.uid(), new.verified_by);
      new.verified_at := now();
    else
      new.verified_by := null;
      new.verified_at := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists documents_before_update on public.documents;
create trigger documents_before_update before update on public.documents
for each row execute function public.documents_before_update();

create or replace function public.documents_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_adviser uuid;
begin
  select profile_id, adviser_id into v_profile, v_adviser from public.clients where id = new.client_id;

  if new.uploaded_by is not distinct from v_profile then
    -- client upload: alert the adviser
    if v_adviser is not null then
      insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
      values (v_adviser, 'document', 'in_app', 'Client uploaded a document', new.name, new.id);
    end if;
  elsif v_profile is not null then
    -- staff upload: alert the client
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_profile, 'document', 'in_app', 'New document available', new.name, new.id);
  end if;

  return null;
end;
$$;

drop trigger if exists documents_after_insert on public.documents;
create trigger documents_after_insert after insert on public.documents
for each row execute function public.documents_after_insert();

create or replace function public.documents_after_verify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
begin
  select profile_id into v_profile from public.clients where id = new.client_id;
  if v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_profile, 'document', 'in_app', 'Document verified', new.name, new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists documents_after_verify on public.documents;
create trigger documents_after_verify after update of is_verified on public.documents
for each row when (new.is_verified and not old.is_verified)
execute function public.documents_after_verify();

-- ---------------------------------------------------------------------------------------------
-- 7. Storage: private client document vault, folder-per-client
-- ---------------------------------------------------------------------------------------------

create or replace function public.storage_client_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return (string_to_array(p_name, '/'))[1]::uuid;
exception when others then
  return null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents', 'client-documents', false, 10485760,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'audio/webm', 'audio/mp4', 'audio/ogg',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "client documents read" on storage.objects;
create policy "client documents read" on storage.objects for select to authenticated
  using (bucket_id = 'client-documents' and public.can_access_client(public.storage_client_id(name)));

drop policy if exists "client documents upload" on storage.objects;
create policy "client documents upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'client-documents' and public.can_access_client(public.storage_client_id(name)));

drop policy if exists "client documents staff update" on storage.objects;
create policy "client documents staff update" on storage.objects for update to authenticated
  using (bucket_id = 'client-documents' and public.is_staff())
  with check (bucket_id = 'client-documents' and public.is_staff());

drop policy if exists "client documents staff delete" on storage.objects;
create policy "client documents staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'client-documents' and public.is_staff());

-- ---------------------------------------------------------------------------------------------
-- 8. Realtime: both apps subscribe so client and adviser screens stay in step
-- ---------------------------------------------------------------------------------------------

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'profiles', 'clients', 'dependants', 'beneficiaries', 'assets', 'liabilities', 'income', 'expenses',
      'policies', 'investments', 'goals', 'documents', 'requests', 'request_workflows', 'claims',
      'claim_timeline', 'claim_witnesses', 'claim_vehicles', 'tasks', 'reminders', 'notifications',
      'messages', 'providers', 'audit_logs'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Internal trigger functions must never be callable through the API.
revoke execute on function public.audit_row_change() from public, anon, authenticated;
revoke execute on function public.requests_after_status_change() from public, anon, authenticated;
revoke execute on function public.claims_after_status_change() from public, anon, authenticated;
revoke execute on function public.documents_after_insert() from public, anon, authenticated;
revoke execute on function public.documents_after_verify() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.guard_client_update() from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_client_id() to authenticated;
grant execute on function public.can_access_client(uuid) to authenticated;
grant execute on function public.storage_client_id(text) to authenticated;

-- ---- migrations/024_workflow_functions.sql ----
-- Migration 024: Workflow functions shared by the client app and the adviser dashboard.
-- Every state change that touches more than one row (request + workflow steps + tasks +
-- notifications, claim + timeline, ...) is a single SECURITY DEFINER function so that both
-- sides always see a consistent picture. All functions authorise the caller explicitly.

-- ---------------------------------------------------------------------------------------------
-- Client: submit a service request
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_client_request(
    p_request_type public.request_type,
    p_title text,
    p_description text default null,
    p_priority public.request_priority default 'normal',
    p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client_id uuid;
    v_adviser uuid;
    v_assigned uuid;
    v_request_id uuid;
    v_number text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client' using errcode = '42501';
    end if;
    if length(trim(coalesce(p_title, ''))) < 3 then
        raise exception 'A request title of at least 3 characters is required';
    end if;

    select adviser_id into v_adviser from public.clients where id = v_client_id;
    v_assigned := coalesce(v_adviser, public.pick_default_adviser());

    v_number := 'RSF-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    insert into public.requests (
        client_id, created_by, assigned_to, request_number, request_type,
        title, description, status, priority, due_date, metadata
    ) values (
        v_client_id, auth.uid(), v_assigned, v_number, p_request_type,
        trim(p_title), nullif(trim(coalesce(p_description, '')), ''), 'submitted', p_priority,
        now() + interval '3 days', coalesce(p_metadata, '{}'::jsonb)
    ) returning id into v_request_id;

    -- Step 1 is done by submitting; step 2 (adviser review) starts immediately.
    insert into public.request_workflows (request_id, step_number, step_key, step_name, status, started_at, completed_at, notes)
    values
      (v_request_id, 1, 'submitted', 'Request submitted', 'completed', now(), now(), 'Submitted via the Royal Square client portal.'),
      (v_request_id, 2, 'review', 'Royal Square review', 'in_progress', now(), null, null),
      (v_request_id, 3, 'processing', 'Processing with provider', 'pending', null, null, null),
      (v_request_id, 4, 'complete', 'Completed and delivered', 'pending', null, null, null);

    if v_assigned is not null then
        insert into public.tasks (client_id, assigned_to, request_id, title, description, priority, due_date)
        values (v_client_id, v_assigned, v_request_id, 'Review request ' || v_number || ': ' || trim(p_title),
                nullif(trim(coalesce(p_description, '')), ''), p_priority, now() + interval '3 days');

        insert into public.notifications (user_id, notification_type, channel, title, body, request_id)
        values (v_assigned, 'request', 'in_app', 'New service request ' || v_number, trim(p_title), v_request_id);
    end if;

    return v_request_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Client: report a motor accident
-- ---------------------------------------------------------------------------------------------
drop function if exists public.create_motor_claim(timestamptz, text, text, uuid);
drop function if exists public.create_motor_claim(timestamptz, text, text, text, text, uuid);

create or replace function public.create_motor_claim(
    p_incident_date timestamptz,
    p_incident_location text,
    p_incident_description text,
    p_police_case_number text default null,
    p_police_station text default null,
    p_provider_id uuid default null,
    p_insured_vehicle text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client_id uuid;
    v_adviser uuid;
    v_assigned uuid;
    v_provider uuid;
    v_claim_id uuid;
    v_number text;
    v_case text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client' using errcode = '42501';
    end if;
    if length(trim(coalesce(p_incident_location, ''))) = 0 or length(trim(coalesce(p_incident_description, ''))) = 0 then
        raise exception 'Incident location and description are required';
    end if;

    select adviser_id into v_adviser from public.clients where id = v_client_id;
    v_assigned := coalesce(v_adviser, public.pick_default_adviser());

    -- Default the insurer to the provider on the client's active motor policy.
    v_provider := p_provider_id;
    if v_provider is null then
        select provider_id into v_provider
        from public.policies
        where client_id = v_client_id and status = 'active' and provider_id is not null
          and policy_type ilike '%motor%'
        order by created_at desc
        limit 1;
    end if;

    v_number := 'CLM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    v_case := nullif(trim(coalesce(p_police_case_number, '')), '');

    insert into public.claims (
        client_id, created_by, assigned_to, provider_id, claim_number, claim_type,
        status, incident_date, incident_location, incident_description,
        police_reported, police_case_number, police_station, hire_car_required, metadata
    ) values (
        v_client_id, auth.uid(), v_assigned, v_provider, v_number, 'motor',
        'reported', coalesce(p_incident_date, now()), trim(p_incident_location), trim(p_incident_description),
        v_case is not null, v_case, nullif(trim(coalesce(p_police_station, '')), ''), false,
        jsonb_strip_nulls(jsonb_build_object('insured_vehicle', nullif(trim(coalesce(p_insured_vehicle, '')), '')))
    ) returning id into v_claim_id;

    insert into public.claim_timeline (claim_id, created_by, status, title, description, is_client_visible)
    values (v_claim_id, auth.uid(), 'reported', 'Accident reported', 'Incident at ' || trim(p_incident_location) || '. Your adviser has been alerted.', true);

    if v_assigned is not null then
        insert into public.tasks (client_id, assigned_to, claim_id, title, description, priority, due_date)
        values (v_client_id, v_assigned, v_claim_id, 'Triage motor claim ' || v_number, trim(p_incident_description), 'urgent', now() + interval '1 day');

        insert into public.notifications (user_id, notification_type, channel, title, body, claim_id)
        values (v_assigned, 'claim', 'in_app', 'New motor claim ' || v_number, trim(p_incident_location), v_claim_id);
    end if;

    return v_claim_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Staff: move a claim to a new stage (timeline entry + client notification come from triggers)
-- ---------------------------------------------------------------------------------------------
create or replace function public.update_claim_status(
    p_claim_id uuid,
    p_status public.claim_status,
    p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may update claim status' using errcode = '42501';
    end if;

    perform set_config('rsf.status_note', coalesce(p_description, ''), true);

    update public.claims
    set status = p_status,
        assigned_to = coalesce(assigned_to, auth.uid())
    where id = p_claim_id;

    if not found then
        raise exception 'Claim not found';
    end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Staff: progress a request
-- ---------------------------------------------------------------------------------------------
create or replace function public.advance_request_workflow(
    p_request_id uuid,
    p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_request public.requests%rowtype;
    v_current public.request_workflows%rowtype;
    v_next_id uuid;
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may progress requests' using errcode = '42501';
    end if;

    select * into v_request from public.requests where id = p_request_id for update;
    if not found then
        raise exception 'Request not found';
    end if;
    if v_request.status in ('completed', 'cancelled') then
        raise exception 'Request is already %', v_request.status;
    end if;

    select * into v_current
    from public.request_workflows
    where request_id = p_request_id and status in ('pending', 'in_progress')
    order by step_number
    limit 1;

    if not found then
        update public.requests set status = 'completed' where id = p_request_id;
        return;
    end if;

    update public.request_workflows
    set status = 'completed',
        started_at = coalesce(started_at, now()),
        completed_at = now(),
        notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes)
    where id = v_current.id;

    select id into v_next_id
    from public.request_workflows
    where request_id = p_request_id and step_number > v_current.step_number and status = 'pending'
    order by step_number
    limit 1;

    if v_next_id is not null then
        update public.request_workflows set status = 'in_progress', started_at = now() where id = v_next_id;
        update public.requests
        set status = 'in_progress', assigned_to = coalesce(assigned_to, auth.uid())
        where id = p_request_id;
    else
        update public.requests set status = 'completed' where id = p_request_id;
    end if;
end;
$$;

-- Staff: park a request (waiting on client / provider), cancel it, or reopen it.
create or replace function public.set_request_status(
    p_request_id uuid,
    p_status public.request_status,
    p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may change request status' using errcode = '42501';
    end if;

    update public.requests set status = p_status where id = p_request_id;
    if not found then
        raise exception 'Request not found';
    end if;

    if nullif(trim(coalesce(p_note, '')), '') is not null then
        update public.request_workflows
        set notes = trim(p_note)
        where id = (
            select id from public.request_workflows
            where request_id = p_request_id and status in ('in_progress', 'pending')
            order by step_number limit 1
        );
    end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Reminders
-- ---------------------------------------------------------------------------------------------
create or replace function public.complete_reminder(p_reminder_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_r public.reminders%rowtype;
    v_step interval;
    v_next timestamptz;
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may action reminders' using errcode = '42501';
    end if;

    select * into v_r from public.reminders where id = p_reminder_id for update;
    if not found then
        raise exception 'Reminder not found';
    end if;

    v_step := case v_r.frequency
        when 'monthly' then interval '1 month'
        when 'quarterly' then interval '3 months'
        when 'six_monthly' then interval '6 months'
        when 'yearly' then interval '1 year'
        when 'every_two_years' then interval '2 years'
        else null
    end;

    if v_step is null then
        update public.reminders set is_completed = true, completed_at = now() where id = p_reminder_id;
    else
        -- recurring: always move on at least one period, then catch up to the future
        v_next := v_r.reminder_date + v_step;
        while v_next <= now() loop
            v_next := v_next + v_step;
        end loop;
        update public.reminders set reminder_date = v_next, last_notified_at = null, completed_at = now() where id = p_reminder_id;
    end if;
end;
$$;

-- Notify client / adviser about reminders that fall due within 48 hours. Intended for pg_cron or a
-- scheduled edge function using the service role; it is not callable by API users.
create or replace function public.process_due_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count integer := 0;
    r record;
begin
    for r in
        select rem.id, rem.title, rem.description, rem.notify_client, rem.notify_adviser,
               c.profile_id as client_profile, coalesce(c.adviser_id, rem.created_by) as adviser_profile
        from public.reminders rem
        join public.clients c on c.id = rem.client_id
        where not rem.is_completed
          and rem.last_notified_at is null
          and rem.reminder_date <= now() + interval '48 hours'
        for update of rem
    loop
        if r.notify_client and r.client_profile is not null then
            insert into public.notifications (user_id, notification_type, channel, title, body, reminder_id)
            values (r.client_profile, 'reminder', 'in_app', r.title, r.description, r.id);
        end if;
        if r.notify_adviser and r.adviser_profile is not null then
            insert into public.notifications (user_id, notification_type, channel, title, body, reminder_id)
            values (r.adviser_profile, 'reminder', 'in_app', 'Reminder due: ' || r.title, r.description, r.id);
        end if;
        update public.reminders set last_notified_at = now() where id = r.id;
        v_count := v_count + 1;
    end loop;
    return v_count;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Messaging (one thread per client)
-- ---------------------------------------------------------------------------------------------
create or replace function public.send_message(
    p_body text,
    p_client_id uuid default null,
    p_subject text default null,
    p_request_id uuid default null,
    p_claim_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client public.clients%rowtype;
    v_staff boolean;
    v_id uuid;
begin
    if length(trim(coalesce(p_body, ''))) = 0 then
        raise exception 'Message body is required';
    end if;

    v_staff := public.is_staff();
    if v_staff then
        select * into v_client from public.clients where id = p_client_id;
    else
        select * into v_client from public.clients where profile_id = auth.uid();
    end if;
    if not found then
        raise exception 'Client not found' using errcode = '42501';
    end if;

    if p_request_id is not null and not exists (select 1 from public.requests where id = p_request_id and client_id = v_client.id) then
        raise exception 'Request does not belong to this client';
    end if;
    if p_claim_id is not null and not exists (select 1 from public.claims where id = p_claim_id and client_id = v_client.id) then
        raise exception 'Claim does not belong to this client';
    end if;

    insert into public.messages (client_id, sender_id, recipient_id, request_id, claim_id, direction, subject, body)
    values (
        v_client.id, auth.uid(),
        case when v_staff then v_client.profile_id else v_client.adviser_id end,
        p_request_id, p_claim_id,
        case when v_staff then 'royal_to_client'::public.message_direction else 'client_to_royal'::public.message_direction end,
        nullif(trim(coalesce(p_subject, '')), ''), trim(p_body)
    ) returning id into v_id;

    if v_staff then
        insert into public.notifications (user_id, notification_type, channel, title, body)
        values (v_client.profile_id, 'message', 'in_app', 'New message from Royal Square', left(trim(p_body), 200));
    elsif v_client.adviser_id is not null then
        insert into public.notifications (user_id, notification_type, channel, title, body)
        values (v_client.adviser_id, 'message', 'in_app', 'New client message', left(trim(p_body), 200));
    else
        insert into public.notifications (user_id, notification_type, channel, title, body)
        select id, 'message', 'in_app', 'New client message', left(trim(p_body), 200)
        from public.profiles where is_active and role in ('adviser', 'admin');
    end if;

    return v_id;
end;
$$;

create or replace function public.mark_thread_read(p_client_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client uuid;
begin
    if public.is_staff() then
        update public.messages
        set is_read = true, read_at = now()
        where client_id = p_client_id and direction = 'client_to_royal' and not is_read;
    else
        v_client := public.current_client_id();
        update public.messages
        set is_read = true, read_at = now()
        where client_id = v_client and direction = 'royal_to_client' and not is_read;
    end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Administration
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_set_user_role(
    p_user_id uuid,
    p_role public.user_role,
    p_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Only administrators may change roles' using errcode = '42501';
    end if;
    if p_user_id = auth.uid() and (p_role <> 'admin' or coalesce(p_is_active, true) = false) then
        raise exception 'You cannot demote or deactivate your own account';
    end if;

    update public.profiles
    set role = p_role, is_active = coalesce(p_is_active, is_active)
    where id = p_user_id;
    if not found then
        raise exception 'User not found';
    end if;

    if p_role = 'client' then
        insert into public.clients (profile_id, client_number, adviser_id, preferred_contact_method)
        values (p_user_id, public.next_client_number(), public.pick_default_adviser(), 'app')
        on conflict (profile_id) do nothing;
    else
        -- A staff member has no client file; only drop it while it is still empty.
        delete from public.clients c
        where c.profile_id = p_user_id
          and not exists (select 1 from public.requests where client_id = c.id)
          and not exists (select 1 from public.claims where client_id = c.id)
          and not exists (select 1 from public.documents where client_id = c.id)
          and not exists (select 1 from public.policies where client_id = c.id)
          and not exists (select 1 from public.investments where client_id = c.id)
          and not exists (select 1 from public.assets where client_id = c.id);
    end if;

    -- Clients of someone who is no longer an adviser are handed to the least-loaded adviser.
    if p_role not in ('adviser', 'admin') or coalesce(p_is_active, true) = false then
        update public.clients set adviser_id = public.pick_default_adviser() where adviser_id = p_user_id;
    end if;
end;
$$;

create or replace function public.assign_client_adviser(p_client_id uuid, p_adviser_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Only administrators may reassign clients' using errcode = '42501';
    end if;
    if not exists (select 1 from public.profiles where id = p_adviser_id and is_active and role in ('adviser', 'admin')) then
        raise exception 'Target user is not an active adviser';
    end if;

    update public.clients set adviser_id = p_adviser_id where id = p_client_id;
    if not found then
        raise exception 'Client not found';
    end if;

    update public.requests set assigned_to = p_adviser_id where client_id = p_client_id and status not in ('completed', 'cancelled');
    update public.claims set assigned_to = p_adviser_id where client_id = p_client_id and status not in ('completed', 'rejected', 'cancelled');
    update public.tasks set assigned_to = p_adviser_id where client_id = p_client_id and status in ('pending', 'in_progress');

    insert into public.notifications (user_id, notification_type, channel, title, body)
    select p_adviser_id, 'system', 'in_app', 'Client assigned to you',
           coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), c.client_number)
    from public.clients c join public.profiles p on p.id = c.profile_id
    where c.id = p_client_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------------------------
revoke execute on function public.create_client_request(public.request_type, text, text, public.request_priority, jsonb) from public, anon;
revoke execute on function public.create_motor_claim(timestamptz, text, text, text, text, uuid, text) from public, anon;
revoke execute on function public.update_claim_status(uuid, public.claim_status, text) from public, anon;
revoke execute on function public.advance_request_workflow(uuid, text) from public, anon;
revoke execute on function public.set_request_status(uuid, public.request_status, text) from public, anon;
revoke execute on function public.complete_reminder(uuid) from public, anon;
revoke execute on function public.process_due_reminders() from public, anon, authenticated;
revoke execute on function public.send_message(text, uuid, text, uuid, uuid) from public, anon;
revoke execute on function public.mark_thread_read(uuid) from public, anon;
revoke execute on function public.admin_set_user_role(uuid, public.user_role, boolean) from public, anon;
revoke execute on function public.assign_client_adviser(uuid, uuid) from public, anon;

grant execute on function public.create_client_request(public.request_type, text, text, public.request_priority, jsonb) to authenticated;
grant execute on function public.create_motor_claim(timestamptz, text, text, text, text, uuid, text) to authenticated;
grant execute on function public.update_claim_status(uuid, public.claim_status, text) to authenticated;
grant execute on function public.advance_request_workflow(uuid, text) to authenticated;
grant execute on function public.set_request_status(uuid, public.request_status, text) to authenticated;
grant execute on function public.complete_reminder(uuid) to authenticated;
grant execute on function public.process_due_reminders() to service_role;
grant execute on function public.send_message(text, uuid, text, uuid, uuid) to authenticated;
grant execute on function public.mark_thread_read(uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.user_role, boolean) to authenticated;
grant execute on function public.assign_client_adviser(uuid, uuid) to authenticated;

-- Schedule reminder processing hourly when pg_cron is available (Supabase: enable the extension first).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('process-due-reminders', '0 * * * *', 'select public.process_due_reminders()');
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end $$;

-- ---- migrations/025_document_processing.sql ----
-- Migration 025: Document processing engine (OCR -> rules -> human review).
-- Adds a processing lifecycle to `documents` and an append-only `document_events` trace.
-- Results are written by the `process-document` edge function (service role) or by staff;
-- clients can never set processing state or verification themselves.
-- `is_verified` stays the single source of truth for FICA / onboarding and is derived from status.

-- ---------------------------------------------------------------------------------------------
-- Status enum + columns
-- ---------------------------------------------------------------------------------------------
do $$ begin
    create type public.document_processing_status as enum (
        'pending', 'processing', 'auto_completed', 'under_review', 'successful', 'rejected'
    );
exception when duplicate_object then null;
end $$;

alter table public.documents
    add column if not exists processing_status public.document_processing_status not null default 'pending',
    add column if not exists confidence_score numeric(4,3) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
    add column if not exists extracted_fields jsonb not null default '{}'::jsonb,
    add column if not exists human_review_required boolean not null default false,
    add column if not exists rejection_reason text,
    add column if not exists reupload_count integer not null default 0 check (reupload_count >= 0),
    add column if not exists escalated_at timestamptz,
    add column if not exists last_processed_at timestamptz;

create index if not exists idx_documents_processing_status on public.documents(processing_status);
create index if not exists idx_documents_client_type on public.documents(client_id, document_type);

-- ---------------------------------------------------------------------------------------------
-- Engine trace: append-only, one row per engine step / human action
-- ---------------------------------------------------------------------------------------------
create table if not exists public.document_events (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.documents(id) on delete cascade,
    client_id uuid not null references public.clients(id) on delete cascade,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    actor uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists idx_document_events_document on public.document_events(document_id, created_at);
create index if not exists idx_document_events_client on public.document_events(client_id);

alter table public.document_events enable row level security;

drop policy if exists document_events_select on public.document_events;
create policy document_events_select on public.document_events for select to authenticated
    using (public.can_access_client(client_id));

-- Staff record their own review actions; the edge function writes engine steps with the service role
-- (which bypasses RLS). No update / delete policy exists, so the trace is append-only.
drop policy if exists document_events_staff_insert on public.document_events;
create policy document_events_staff_insert on public.document_events for insert to authenticated
    with check (public.is_staff() and actor = auth.uid());

-- ---------------------------------------------------------------------------------------------
-- Insert guard: uploads always start un-processed and un-verified unless a staff member / the
-- service role says otherwise (closes the hole where a client could insert is_verified = true).
-- ---------------------------------------------------------------------------------------------
create or replace function public.documents_before_insert_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.processing_status := 'pending';
    new.confidence_score := null;
    new.extracted_fields := '{}'::jsonb;
    new.human_review_required := false;
    new.rejection_reason := null;
    new.reupload_count := 0;
    new.escalated_at := null;
    new.last_processed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists documents_before_insert_guard on public.documents;
create trigger documents_before_insert_guard before insert on public.documents
for each row execute function public.documents_before_insert_guard();

-- ---------------------------------------------------------------------------------------------
-- Keep is_verified and processing_status coherent, then stamp verification (replaces 023's version)
-- ---------------------------------------------------------------------------------------------
create or replace function public.documents_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.processing_status is distinct from old.processing_status then
    -- status is authoritative: only completed documents count as verified
    new.is_verified := new.processing_status in ('auto_completed', 'successful');
  elsif new.is_verified is distinct from old.is_verified then
    -- legacy path (plain verify / un-verify toggle): move the status with it
    new.processing_status := case when new.is_verified then 'successful' else 'pending' end;
  end if;

  if new.is_verified is distinct from old.is_verified then
    if new.is_verified then
      new.verified_by := coalesce(auth.uid(), new.verified_by);
      new.verified_at := now();
    else
      new.verified_by := null;
      new.verified_at := null;
    end if;
  end if;
  return new;
end;
$$;

-- "UPDATE OF is_verified" only fires when the column is in the statement's SET list, so a status change
-- that flips is_verified inside the BEFORE trigger would be missed. Fire on any update instead.
drop trigger if exists documents_after_verify on public.documents;
create trigger documents_after_verify after update on public.documents
for each row when (new.is_verified and not old.is_verified)
execute function public.documents_after_verify();

-- ---------------------------------------------------------------------------------------------
-- Notifications for engine outcomes: rejected -> client, escalated / needs review -> adviser
-- ---------------------------------------------------------------------------------------------
create or replace function public.documents_after_processing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_adviser uuid;
begin
  select profile_id, adviser_id into v_profile, v_adviser from public.clients where id = new.client_id;

  if new.processing_status = 'rejected' and v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_profile, 'document', 'in_app', 'Document rejected - please upload again',
            coalesce(new.rejection_reason, new.name), new.id);
  end if;

  if new.escalated_at is not null and old.escalated_at is null and v_adviser is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_adviser, 'document', 'in_app', 'Document escalated for manual review', new.name, new.id);
  elsif new.processing_status = 'under_review' and old.processing_status is distinct from 'under_review' and v_adviser is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_adviser, 'document', 'in_app', 'Document needs review', new.name, new.id);
  end if;

  return null;
end;
$$;

drop trigger if exists documents_after_processing on public.documents;
create trigger documents_after_processing after update on public.documents
for each row when (
  new.processing_status is distinct from old.processing_status
  or (new.escalated_at is not null and old.escalated_at is null)
)
execute function public.documents_after_processing();

revoke execute on function public.documents_after_processing() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Backfill: already-verified documents are complete
-- ---------------------------------------------------------------------------------------------
update public.documents set processing_status = 'successful'
where is_verified and processing_status = 'pending';
