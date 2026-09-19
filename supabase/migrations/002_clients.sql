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
