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
