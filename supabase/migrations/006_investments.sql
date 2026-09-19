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
