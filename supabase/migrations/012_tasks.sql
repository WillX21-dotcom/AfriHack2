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
