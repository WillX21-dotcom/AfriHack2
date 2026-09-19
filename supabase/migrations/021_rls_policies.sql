-- Migration 021: Row Level Security policies for client/admin collaboration

create or replace function public.can_access_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff() or exists (
    select 1 from public.clients where id = p_client_id and profile_id = auth.uid()
  );
$$;

grant execute on function public.can_access_client(uuid) to authenticated;

-- Profiles and clients
 drop policy if exists profiles_read_own_or_staff on public.profiles;
 create policy profiles_read_own_or_staff on public.profiles for select to authenticated
   using (id = auth.uid() or public.is_staff());

 drop policy if exists profiles_update_own on public.profiles;
 create policy profiles_update_own on public.profiles for update to authenticated
   using (id = auth.uid()) with check (id = auth.uid());

 drop policy if exists clients_read_own_or_staff on public.clients;
 create policy clients_read_own_or_staff on public.clients for select to authenticated
   using (profile_id = auth.uid() or public.is_staff());

-- Client-owned records
 do $$
 declare
   table_name text;
 begin
   foreach table_name in array array[
     'dependants', 'beneficiaries', 'assets', 'liabilities', 'income', 'expenses',
     'policies', 'investments', 'goals', 'documents', 'requests', 'claims'
   ] loop
     execute format('drop policy if exists %I_read_own_or_staff on public.%I', table_name, table_name);
     execute format('create policy %I_read_own_or_staff on public.%I for select to authenticated using (public.can_access_client(client_id))', table_name, table_name);
   end loop;
 end $$;

-- Related request and claim records
 drop policy if exists request_workflows_read_related on public.request_workflows;
 create policy request_workflows_read_related on public.request_workflows for select to authenticated
   using (public.is_staff() or exists (select 1 from public.requests r where r.id = request_id and public.can_access_client(r.client_id)));

 drop policy if exists request_workflows_staff_update on public.request_workflows;
 create policy request_workflows_staff_update on public.request_workflows for update to authenticated
   using (public.is_staff()) with check (public.is_staff());

 drop policy if exists requests_staff_update on public.requests;
 create policy requests_staff_update on public.requests for update to authenticated
   using (public.is_staff()) with check (public.is_staff());

 drop policy if exists claim_timeline_read_related on public.claim_timeline;
 create policy claim_timeline_read_related on public.claim_timeline for select to authenticated
   using (public.is_staff() or exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));

 drop policy if exists claims_staff_update on public.claims;
 create policy claims_staff_update on public.claims for update to authenticated
   using (public.is_staff()) with check (public.is_staff());

 drop policy if exists claim_timeline_staff_insert on public.claim_timeline;
 create policy claim_timeline_staff_insert on public.claim_timeline for insert to authenticated
   with check (public.is_staff());

 drop policy if exists claim_witnesses_read_related on public.claim_witnesses;
 create policy claim_witnesses_read_related on public.claim_witnesses for select to authenticated
   using (public.is_staff() or exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));

 drop policy if exists claim_vehicles_read_related on public.claim_vehicles;
 create policy claim_vehicles_read_related on public.claim_vehicles for select to authenticated
   using (public.is_staff() or exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));

 drop policy if exists claim_witnesses_client_insert on public.claim_witnesses;
 create policy claim_witnesses_client_insert on public.claim_witnesses for insert to authenticated
   with check (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));

 drop policy if exists claim_vehicles_client_insert on public.claim_vehicles;
 create policy claim_vehicles_client_insert on public.claim_vehicles for insert to authenticated
   with check (exists (select 1 from public.claims c where c.id = claim_id and public.can_access_client(c.client_id)));

-- Staff-owned operational records and provider catalog
 drop policy if exists providers_read_authenticated on public.providers;
 create policy providers_read_authenticated on public.providers for select to authenticated using (true);

 drop policy if exists tasks_staff_all on public.tasks;
 create policy tasks_staff_all on public.tasks for all to authenticated using (public.is_staff()) with check (public.is_staff());

 drop policy if exists reminders_staff_all on public.reminders;
 create policy reminders_staff_all on public.reminders for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Notifications and messages
 drop policy if exists notifications_read_own_or_staff on public.notifications;
 create policy notifications_read_own_or_staff on public.notifications for select to authenticated
   using (user_id = auth.uid() or public.is_staff());

 drop policy if exists messages_read_participants_or_staff on public.messages;
 create policy messages_read_participants_or_staff on public.messages for select to authenticated
   using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_staff());

-- Auditing is readable by staff only
 drop policy if exists audit_logs_staff_read on public.audit_logs;
 create policy audit_logs_staff_read on public.audit_logs for select to authenticated using (public.is_staff());

-- Profiles: users can read their own profile; staff can read all profiles
create policy "users read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_staff());

-- Clients: clients read their own record; staff read all
create policy "clients read own record"
on public.clients
for select
to authenticated
using (profile_id = auth.uid() or public.is_staff());

-- Client-owned financial records
create policy "clients read own assets"
on public.assets
for select
to authenticated
using (
  client_id = public.current_client_id()
  or public.is_staff()
);

create policy "clients read own liabilities"
on public.liabilities
for select
to authenticated
using (
  client_id = public.current_client_id()
  or public.is_staff()
);

create policy "clients read own investments"
on public.investments
for select
to authenticated
using (
  client_id = public.current_client_id()
  or public.is_staff()
);

create policy "clients read own goals"
on public.goals
for select
to authenticated
using (
  client_id = public.current_client_id()
  or public.is_staff()
);

-- Requests
create policy "clients read own requests"
on public.requests
for select
to authenticated
using (
  client_id = public.current_client_id()
  or public.is_staff()
);

create policy "clients create own requests"
on public.requests
for insert
to authenticated
with check (
  client_id = public.current_client_id()
  and created_by = auth.uid()
);

-- Claims
create policy "clients read own claims"
on public.claims
for select
to authenticated
using (
  client_id = public.current_client_id()
  or public.is_staff()
);

-- Notifications
create policy "users read own notifications"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_staff()
);

-- Documents
create policy "clients read own documents"
on public.documents
for select
to authenticated
using (
  client_id = public.current_client_id()
  or public.is_staff()
);