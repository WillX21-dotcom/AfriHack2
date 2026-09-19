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
