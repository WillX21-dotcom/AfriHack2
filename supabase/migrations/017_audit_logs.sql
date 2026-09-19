-- Migration 017: Audit Logs
do $$ begin
    create type public.audit_action as enum (
        'create', 'update', 'delete', 'login', 'logout', 'upload',
        'download', 'status_change', 'assign', 'complete'
    );
exception when duplicate_object then null;
end $$;

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    action public.audit_action not null,
    table_name text,
    record_id uuid,
    description text,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_record on public.audit_logs(record_id);
