-- Migration 023: Schema corrections, hardened RLS, server-side auditing, notifications, storage, realtime.
--
-- This migration is the single source of truth for Row Level Security: it drops every existing
-- policy in the public schema (021 mixed two overlapping generations of policies, some of which
-- allowed clients to insert requests directly and to read internal claim timeline entries) and
-- recreates the complete set.

-- ---------------------------------------------------------------------------------------------
-- 0. Remove objects left behind by earlier manual set-ups
-- ---------------------------------------------------------------------------------------------
-- An older hand-written layer (triggers named trg_*) overlaps this schema: it creates the same
-- request workflow steps (so create_client_request() hit the unique(request_id, step_number) key),
-- writes duplicate claim timeline / notification / audit rows, and its protect_* triggers reject the
-- SQL editor (no signed-in user) so an administrator could never be bootstrapped. guard_profile_update
-- and guard_client_update below replace the protect_* triggers. Nothing here matches the triggers
-- this schema creates (none of them start with "trg_"), and dropping is a no-op on a clean project.
do $$
declare
  r record;
begin
  for r in
    select c.relname as tbl, t.tgname as trg
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and not t.tgisinternal and t.tgname like 'trg\_%' escape '\'
  loop
    execute format('drop trigger if exists %I on public.%I', r.trg, r.tbl);
  end loop;
end $$;

drop function if exists public.protect_profile_fields();
drop function if exists public.protect_client_fields();
drop function if exists public.add_claim_status_timeline();
drop function if exists public.notify_claim_update();
drop function if exists public.audit_request_changes();
drop function if exists public.initialize_request_workflow();
drop function if exists public.notify_request_assignment();
drop function if exists public.generate_claim_number();
drop function if exists public.generate_request_number();

-- ---------------------------------------------------------------------------------------------
-- 1. Schema corrections
-- ---------------------------------------------------------------------------------------------

-- Per-client audit trail (used by the adviser dashboard client 360 view). Deliberately NOT a foreign
-- key: audit records must outlive the client record they describe.
alter table public.audit_logs add column if not exists client_id uuid;
create index if not exists idx_audit_logs_client on public.audit_logs(client_id);

-- Claim repairer shown to both the client and the adviser.
alter table public.claims add column if not exists repairer_name text;

-- Documents can be attached to the request / claim they were produced for.
alter table public.documents add column if not exists request_id uuid references public.requests(id) on delete set null;
alter table public.documents add column if not exists claim_id uuid references public.claims(id) on delete set null;
create index if not exists idx_documents_request on public.documents(request_id);
create index if not exists idx_documents_claim on public.documents(claim_id);

-- Reminders: completion time + de-duplication of due notifications.
alter table public.reminders add column if not exists completed_at timestamptz;
alter table public.reminders add column if not exists last_notified_at timestamptz;

create index if not exists idx_notifications_created on public.notifications(user_id, created_at desc);

-- Provider references were plain uuids with no integrity. NOT VALID enforces the FK for new rows
-- without failing on any pre-existing rows.
do $$ begin
  alter table public.policies add constraint policies_provider_fk foreign key (provider_id) references public.providers(id) on delete set null not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.investments add constraint investments_provider_fk foreign key (provider_id) references public.providers(id) on delete set null not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.claims add constraint claims_provider_fk foreign key (provider_id) references public.providers(id) on delete set null not valid;
exception when duplicate_object then null; end $$;

-- 016 seeded placeholder "mock@..." contact addresses. Providers are a real, adviser-maintained catalogue.
update public.providers set contact_email = null where contact_email like 'mock@%.example';

-- ---------------------------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- Uniform updated_at maintenance (clients used to set this themselves).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select c.table_name
    from information_schema.columns c
    join pg_tables pt on pt.schemaname = c.table_schema and pt.tablename = c.table_name
    where c.table_schema = 'public' and c.column_name = 'updated_at'
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- 3. Privilege-escalation guards
-- ---------------------------------------------------------------------------------------------

-- A user may edit their own name / phone / avatar, but never their role, status or email.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role, the SQL editor and GoTrue-initiated changes.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.email is distinct from old.email then
    raise exception 'Role, status and email can only be changed by an administrator' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
for each row execute function public.guard_profile_update();

-- Clients may maintain their own personal details, but not who their adviser is, their client
-- number, risk profile, internal notes or onboarding sign-off.
create or replace function public.guard_client_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id
     or new.client_number is distinct from old.client_number
     or new.adviser_id is distinct from old.adviser_id
     or new.risk_profile is distinct from old.risk_profile
     or new.onboarding_completed is distinct from old.onboarding_completed
     or new.notes is distinct from old.notes then
    raise exception 'Adviser-managed client fields cannot be changed by the client' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_client_update on public.clients;
create trigger guard_client_update before update on public.clients
for each row execute function public.guard_client_update();

-- ---------------------------------------------------------------------------------------------
-- 4. Row Level Security (complete policy set)
-- ---------------------------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.dependants enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.providers enable row level security;
alter table public.policies enable row level security;
alter table public.investments enable row level security;
alter table public.goals enable row level security;
alter table public.documents enable row level security;
alter table public.requests enable row level security;
alter table public.request_workflows enable row level security;
alter table public.claims enable row level security;
alter table public.claim_timeline enable row level security;
alter table public.claim_witnesses enable row level security;
alter table public.claim_vehicles enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profiles & clients
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy clients_select on public.clients for select to authenticated
  using (profile_id = auth.uid() or public.is_staff());
create policy clients_update on public.clients for update to authenticated
  using (profile_id = auth.uid() or public.is_staff())
  with check (profile_id = auth.uid() or public.is_staff());

-- Balance sheet, cover and family records: clients read, staff maintain.
do $$
declare
  t text;
begin
  foreach t in array array['dependants', 'beneficiaries', 'assets', 'liabilities', 'income', 'expenses', 'policies', 'investments'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.can_access_client(client_id))', t || '_select', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t || '_staff_write', t);
  end loop;
end $$;

-- Goals: clients manage their own, staff can manage any.
create policy goals_select on public.goals for select to authenticated
  using (public.can_access_client(client_id));
create policy goals_write on public.goals for all to authenticated
  using (client_id = public.current_client_id() or public.is_staff())
  with check (client_id = public.current_client_id() or public.is_staff());

-- Documents: owner or staff may upload (into their own client folder); only staff verify / remove.
create policy documents_select on public.documents for select to authenticated
  using (public.can_access_client(client_id));
create policy documents_insert on public.documents for insert to authenticated
  with check (public.can_access_client(client_id) and uploaded_by = auth.uid());
create policy documents_staff_update on public.documents for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy documents_staff_delete on public.documents for delete to authenticated
  using (public.is_staff());

-- Requests: created only through create_client_request(); staff progress them.
create policy requests_select on public.requests for select to authenticated
  using (public.can_access_client(client_id));
create policy requests_staff_update on public.requests for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy request_workflows_select on public.request_workflows for select to authenticated
  using (exists (select 1 from public.requests r where r.id = request_id and public.can_access_client(r.client_id)));
create policy request_workflows_staff_update on public.request_workflows for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Claims: created only through create_motor_claim(); staff progress them.
create policy claims_select on public.claims for select to authenticated
  using (public.can_access_client(client_id));
create policy claims_staff_update on public.claims for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Clients only see timeline entries flagged client-visible; staff see everything.
create policy claim_timeline_select on public.claim_timeline for select to authenticated
  using (
    public.is_staff()
    or (is_client_visible and exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)))
  );
create policy claim_timeline_staff_insert on public.claim_timeline for insert to authenticated
  with check (public.is_staff());

create policy claim_witnesses_select on public.claim_witnesses for select to authenticated
  using (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_witnesses_insert on public.claim_witnesses for insert to authenticated
  with check (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_witnesses_staff_write on public.claim_witnesses for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy claim_vehicles_select on public.claim_vehicles for select to authenticated
  using (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_vehicles_insert on public.claim_vehicles for insert to authenticated
  with check (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));
create policy claim_vehicles_staff_write on public.claim_vehicles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Staff work queues. Clients can read reminders that are flagged for them.
create policy tasks_staff_all on public.tasks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy reminders_staff_all on public.reminders for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy reminders_client_select on public.reminders for select to authenticated
  using (notify_client and client_id = public.current_client_id());

-- Notifications belong to the recipient; they may only flip the read flag (column grant below).
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Messages are one thread per client; writes go through send_message().
create policy messages_select on public.messages for select to authenticated
  using (public.can_access_client(client_id));

-- Provider catalogue: everyone signed in reads, staff maintain.
create policy providers_select on public.providers for select to authenticated using (true);
create policy providers_staff_update on public.providers for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy providers_admin_insert on public.providers for insert to authenticated
  with check (public.is_admin());

-- Audit trail: staff read only. Rows are written exclusively by SECURITY DEFINER triggers.
create policy audit_logs_staff_select on public.audit_logs for select to authenticated
  using (public.is_staff());

create policy push_subscriptions_own on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Table privileges: nothing for anon; narrow write access where policies alone are too coarse.
revoke all on all tables in schema public from anon;
revoke insert, update, delete, truncate on public.audit_logs from authenticated;
revoke update on public.notifications from authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 5. Tamper-resistant audit trail (server side, replaces client-side logging)
-- ---------------------------------------------------------------------------------------------

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
  v_action public.audit_action;
  v_id uuid;
  v_client uuid;
  v_label text;
  v_desc text;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_row := v_new;
    v_action := case when tg_table_name = 'documents' then 'upload' else 'create' end;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_row := v_new;
    -- updated_at churn alone is not an auditable change
    if (v_old - 'updated_at') = (v_new - 'updated_at') then
      return null;
    end if;
    v_action := case when v_old ->> 'status' is distinct from v_new ->> 'status' then 'status_change' else 'update' end;
  else
    v_old := to_jsonb(old);
    v_row := v_old;
    v_action := 'delete';
  end if;

  v_id := nullif(v_row ->> 'id', '')::uuid;
  v_client := case when tg_table_name = 'clients' then v_id else nullif(v_row ->> 'client_id', '')::uuid end;
  v_label := coalesce(v_row ->> 'request_number', v_row ->> 'claim_number', v_row ->> 'client_number', v_row ->> 'name', v_row ->> 'title', v_row ->> 'email', '');

  if v_action = 'status_change' then
    v_desc := format('%s %s: status %s -> %s', tg_table_name, v_label, v_old ->> 'status', v_new ->> 'status');
  else
    v_desc := format('%s %s %s', tg_table_name, lower(tg_op), v_label);
  end if;

  insert into public.audit_logs (user_id, action, table_name, record_id, client_id, description, old_data, new_data)
  values (auth.uid(), v_action, tg_table_name, v_id, v_client, trim(v_desc), v_old, v_new);

  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'clients', 'requests', 'claims', 'documents', 'reminders', 'tasks', 'goals',
    'policies', 'investments', 'assets', 'liabilities', 'income', 'expenses', 'dependants', 'beneficiaries'
  ] loop
    execute format('drop trigger if exists audit_row_change on public.%I', t);
    execute format('create trigger audit_row_change after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- 6. Lifecycle triggers: keep client and adviser views consistent and notify the other side
-- ---------------------------------------------------------------------------------------------

-- Requests: stamp completion, tidy tasks, tell the client.
create or replace function public.requests_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'completed' then
      new.completed_at := coalesce(new.completed_at, now());
    else
      new.completed_at := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists requests_before_update on public.requests;
create trigger requests_before_update before update on public.requests
for each row execute function public.requests_before_update();

create or replace function public.requests_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
begin
  select profile_id into v_profile from public.clients where id = new.client_id;

  if v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, request_id)
    values (
      v_profile, 'request', 'in_app',
      format('Request %s: %s', coalesce(new.request_number, ''), initcap(replace(new.status::text, '_', ' '))),
      new.title,
      new.id
    );
  end if;

  if new.status in ('completed', 'cancelled') then
    update public.tasks
    set status = case when new.status = 'completed' then 'completed'::public.task_status else 'cancelled'::public.task_status end,
        completed_at = now()
    where request_id = new.id and status in ('pending', 'in_progress');
  end if;

  return null;
end;
$$;

drop trigger if exists requests_after_status_change on public.requests;
create trigger requests_after_status_change after update of status on public.requests
for each row when (old.status is distinct from new.status)
execute function public.requests_after_status_change();

-- Claims: stamp closure / authorisation, write the client-visible timeline entry, tell the client.
create or replace function public.claims_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('completed', 'rejected', 'cancelled') then
      new.closed_at := coalesce(new.closed_at, now());
    else
      new.closed_at := null;
    end if;
    if new.status = 'authorised' then
      new.repair_authorised := true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists claims_before_update on public.claims;
create trigger claims_before_update before update on public.claims
for each row execute function public.claims_before_update();

create or replace function public.claims_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_note text;
  v_label text;
begin
  v_note := nullif(trim(coalesce(current_setting('rsf.status_note', true), '')), '');
  v_label := initcap(replace(new.status::text, '_', ' '));

  insert into public.claim_timeline (claim_id, created_by, status, title, description, is_client_visible)
  values (new.id, auth.uid(), new.status, 'Claim status: ' || v_label, coalesce(v_note, 'Status updated by Royal Square.'), true);

  select profile_id into v_profile from public.clients where id = new.client_id;
  if v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, claim_id)
    values (
      v_profile, 'claim', 'in_app',
      format('Claim %s: %s', coalesce(new.claim_number, ''), v_label),
      coalesce(v_note, 'Your claim has moved to a new stage.'),
      new.id
    );
  end if;

  return null;
end;
$$;

drop trigger if exists claims_after_status_change on public.claims;
create trigger claims_after_status_change after update of status on public.claims
for each row when (old.status is distinct from new.status)
execute function public.claims_after_status_change();

-- Documents: stamp verification, and tell the other party about new / verified documents.
create or replace function public.documents_before_update()
returns trigger
language plpgsql
as $$
begin
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

drop trigger if exists documents_before_update on public.documents;
create trigger documents_before_update before update on public.documents
for each row execute function public.documents_before_update();

create or replace function public.documents_after_insert()
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

  if new.uploaded_by is not distinct from v_profile then
    -- client upload: alert the adviser
    if v_adviser is not null then
      insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
      values (v_adviser, 'document', 'in_app', 'Client uploaded a document', new.name, new.id);
    end if;
  elsif v_profile is not null then
    -- staff upload: alert the client
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_profile, 'document', 'in_app', 'New document available', new.name, new.id);
  end if;

  return null;
end;
$$;

drop trigger if exists documents_after_insert on public.documents;
create trigger documents_after_insert after insert on public.documents
for each row execute function public.documents_after_insert();

create or replace function public.documents_after_verify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
begin
  select profile_id into v_profile from public.clients where id = new.client_id;
  if v_profile is not null then
    insert into public.notifications (user_id, notification_type, channel, title, body, document_id)
    values (v_profile, 'document', 'in_app', 'Document verified', new.name, new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists documents_after_verify on public.documents;
create trigger documents_after_verify after update of is_verified on public.documents
for each row when (new.is_verified and not old.is_verified)
execute function public.documents_after_verify();

-- ---------------------------------------------------------------------------------------------
-- 7. Storage: private client document vault, folder-per-client
-- ---------------------------------------------------------------------------------------------

create or replace function public.storage_client_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return (string_to_array(p_name, '/'))[1]::uuid;
exception when others then
  return null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents', 'client-documents', false, 10485760,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'audio/webm', 'audio/mp4', 'audio/ogg',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "client documents read" on storage.objects;
create policy "client documents read" on storage.objects for select to authenticated
  using (bucket_id = 'client-documents' and public.can_access_client(public.storage_client_id(name)));

drop policy if exists "client documents upload" on storage.objects;
create policy "client documents upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'client-documents' and public.can_access_client(public.storage_client_id(name)));

drop policy if exists "client documents staff update" on storage.objects;
create policy "client documents staff update" on storage.objects for update to authenticated
  using (bucket_id = 'client-documents' and public.is_staff())
  with check (bucket_id = 'client-documents' and public.is_staff());

drop policy if exists "client documents staff delete" on storage.objects;
create policy "client documents staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'client-documents' and public.is_staff());

-- ---------------------------------------------------------------------------------------------
-- 8. Realtime: both apps subscribe so client and adviser screens stay in step
-- ---------------------------------------------------------------------------------------------

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'profiles', 'clients', 'dependants', 'beneficiaries', 'assets', 'liabilities', 'income', 'expenses',
      'policies', 'investments', 'goals', 'documents', 'requests', 'request_workflows', 'claims',
      'claim_timeline', 'claim_witnesses', 'claim_vehicles', 'tasks', 'reminders', 'notifications',
      'messages', 'providers', 'audit_logs'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Internal trigger functions must never be callable through the API.
revoke execute on function public.audit_row_change() from public, anon, authenticated;
revoke execute on function public.requests_after_status_change() from public, anon, authenticated;
revoke execute on function public.claims_after_status_change() from public, anon, authenticated;
revoke execute on function public.documents_after_insert() from public, anon, authenticated;
revoke execute on function public.documents_after_verify() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.guard_client_update() from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_client_id() to authenticated;
grant execute on function public.can_access_client(uuid) to authenticated;
grant execute on function public.storage_client_id(text) to authenticated;
