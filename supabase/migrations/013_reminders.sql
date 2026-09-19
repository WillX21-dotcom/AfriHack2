-- Migration 013: Reminders
do $$ begin
    create type public.reminder_frequency as enum ('once', 'monthly', 'quarterly', 'six_monthly', 'yearly', 'every_two_years');
exception when duplicate_object then null;
end $$;

create table if not exists public.reminders (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete set null,
    title text not null,
    description text,
    reminder_date timestamptz not null,
    frequency public.reminder_frequency not null default 'once',
    is_completed boolean not null default false,
    notify_client boolean not null default true,
    notify_adviser boolean not null default true,
    related_document_id uuid references public.documents(id) on delete set null,
    related_policy_id uuid references public.policies(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_reminders_client on public.reminders(client_id);
create index if not exists idx_reminders_date on public.reminders(reminder_date);
