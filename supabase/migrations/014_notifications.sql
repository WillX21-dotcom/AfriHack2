-- Migration 014: Notifications & Push Subscriptions
do $$ begin
    create type public.notification_type as enum ('request', 'claim', 'reminder', 'document', 'message', 'goal', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.notification_channel as enum ('in_app', 'push', 'email');
exception when duplicate_object then null;
end $$;

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    notification_type public.notification_type not null,
    channel public.notification_channel not null default 'in_app',
    title text not null,
    body text,
    request_id uuid references public.requests(id) on delete cascade,
    claim_id uuid references public.claims(id) on delete cascade,
    reminder_id uuid references public.reminders(id) on delete cascade,
    document_id uuid references public.documents(id) on delete cascade,
    is_read boolean not null default false,
    read_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    endpoint text not null unique,
    p256dh text,
    auth_key text,
    user_agent text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
