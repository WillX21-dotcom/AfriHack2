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
