-- Migration 015: Messages
do $$ begin
    create type public.message_direction as enum ('client_to_royal', 'royal_to_client');
exception when duplicate_object then null;
end $$;

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,
    recipient_id uuid references public.profiles(id) on delete cascade,
    request_id uuid references public.requests(id) on delete cascade,
    claim_id uuid references public.claims(id) on delete cascade,
    direction public.message_direction not null,
    subject text,
    body text not null,
    attachment_path text,
    is_read boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_messages_client on public.messages(client_id);
create index if not exists idx_messages_request on public.messages(request_id);
create index if not exists idx_messages_claim on public.messages(claim_id);
create index if not exists idx_messages_created on public.messages(created_at desc);
