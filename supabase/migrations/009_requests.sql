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
