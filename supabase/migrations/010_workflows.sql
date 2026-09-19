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
