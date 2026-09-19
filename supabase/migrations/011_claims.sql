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
