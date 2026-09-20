-- Migration 025: Document processing engine (OCR -> rules -> human review).
-- Adds a processing lifecycle to `documents` and an append-only `document_events` trace.
-- Results are written by the `process-document` edge function (service role) or by staff;
-- clients can never set processing state or verification themselves.
-- `is_verified` stays the single source of truth for FICA / onboarding and is derived from status.

-- ---------------------------------------------------------------------------------------------
-- Status enum + columns
-- ---------------------------------------------------------------------------------------------
do $$ begin
    create type public.document_processing_status as enum (
        'pending', 'processing', 'auto_completed', 'under_review', 'successful', 'rejected'
    );
exception when duplicate_object then null;
end $$;

alter table public.documents
    add column if not exists processing_status public.document_processing_status not null default 'pending',
    add column if not exists confidence_score numeric(4,3) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
    add column if not exists extracted_fields jsonb not null default '{}'::jsonb,
    add column if not exists human_review_required boolean not null default false,
    add column if not exists rejection_reason text,
    add column if not exists reupload_count integer not null default 0 check (reupload_count >= 0),
    add column if not exists escalated_at timestamptz,
    add column if not exists last_processed_at timestamptz;

create index if not exists idx_documents_processing_status on public.documents(processing_status);
create index if not exists idx_documents_client_type on public.documents(client_id, document_type);

-- ---------------------------------------------------------------------------------------------
-- Engine trace: append-only, one row per engine step / human action
-- ---------------------------------------------------------------------------------------------
create table if not exists public.document_events (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.documents(id) on delete cascade,
    client_id uuid not null references public.clients(id) on delete cascade,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    actor uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists idx_document_events_document on public.document_events(document_id, created_at);
create index if not exists idx_document_events_client on public.document_events(client_id);

alter table public.document_events enable row level security;

drop policy if exists document_events_select on public.document_events;
create policy document_events_select on public.document_events for select to authenticated
    using (public.can_access_client(client_id));

-- Staff record their own review actions; the edge function writes engine steps with the service role
-- (which bypasses RLS). No update / delete policy exists, so the trace is append-only.
drop policy if exists document_events_staff_insert on public.document_events;
create policy document_events_staff_insert on public.document_events for insert to authenticated
    with check (public.is_staff() and actor = auth.uid());

-- ---------------------------------------------------------------------------------------------
-- Insert guard: uploads always start un-processed and un-verified unless a staff member / the
-- service role says otherwise (closes the hole where a client could insert is_verified = true).
-- ---------------------------------------------------------------------------------------------
create or replace function public.documents_before_insert_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.processing_status := 'pending';
    new.confidence_score := null;
    new.extracted_fields := '{}'::jsonb;
    new.human_review_required := false;
    new.rejection_reason := null;
    new.reupload_count := 0;
    new.escalated_at := null;
    new.last_processed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists documents_before_insert_guard on public.documents;
create trigger documents_before_insert_guard before insert on public.documents
for each row execute function public.documents_before_insert_guard();

-- ---------------------------------------------------------------------------------------------
-- Keep is_verified and processing_status coherent, then stamp verification (replaces 023's version)
-- ---------------------------------------------------------------------------------------------
create or replace function public.documents_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.processing_status is distinct from old.processing_status then
    -- status is authoritative: only completed documents count as verified
    new.is_verified := new.processing_status in ('auto_completed', 'successful');
  elsif new.is_verified is distinct from old.is_verified then
    -- legacy path (plain verify / un-verify toggle): move the status with it
    new.processing_status := case when new.is_verified then 'successful' else 'pending' end;
  end if;

  if new.is_verified is distinct from old.is_verified then
    if new.is_verified then
      new.verified_by := coalesce(auth.uid(), new.verified_by);
      new.verified_at := now();
    else
      new.verified_by := null;
      new.verified_at := null;
    end if;
  end if;
  return new;
end;
$$;

-- "UPDATE OF is_verified" only fires when the column is in the statement's SET list, so a status change
-- that flips is_verified inside the BEFORE trigger would be missed. Fire on any update instead.
drop trigger if exists documents_after_verify on public.documents;
create trigger documents_after_verify after update on public.documents
for each row when (new.is_verified and not old.is_verified)
execute function public.documents_after_verify();

-- ---------------------------------------------------------------------------------------------
-- Notifications for engine outcomes: rejected -> client, escalated / needs review -> adviser
-- ---------------------------------------------------------------------------------------------
create or replace function public.documents_after_processing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_adviser uuid;
begin
  select profile_id, adviser_id into v_profile, v_adviser from public.clients where id = new.client_id;

  if new.processing_status = 'rejected' and v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_profile, 'document', 'in_app', 'Document rejected - please upload again',
            coalesce(new.rejection_reason, new.name), new.id);
  end if;

  if new.escalated_at is not null and old.escalated_at is null and v_adviser is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_adviser, 'document', 'in_app', 'Document escalated for manual review', new.name, new.id);
  elsif new.processing_status = 'under_review' and old.processing_status is distinct from 'under_review' and v_adviser is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_adviser, 'document', 'in_app', 'Document needs review', new.name, new.id);
  end if;

  return null;
end;
$$;

drop trigger if exists documents_after_processing on public.documents;
create trigger documents_after_processing after update on public.documents
for each row when (
  new.processing_status is distinct from old.processing_status
  or (new.escalated_at is not null and old.escalated_at is null)
)
execute function public.documents_after_processing();

revoke execute on function public.documents_after_processing() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Backfill: already-verified documents are complete
-- ---------------------------------------------------------------------------------------------
update public.documents set processing_status = 'successful'
where is_verified and processing_status = 'pending';
