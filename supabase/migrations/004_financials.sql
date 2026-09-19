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
