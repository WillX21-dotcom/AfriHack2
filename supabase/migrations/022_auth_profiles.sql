-- Migration 022: Provision an application profile + client record for every Supabase Auth user.
--
-- SECURITY: the role is NEVER read from sign-up metadata or the email address. Every new account
-- starts as a 'client'. Staff roles are granted by an existing admin (see 024_workflow_functions.sql,
-- admin_set_user_role) or by SQL run with elevated privileges (see docs/database.md, "First admin").

create sequence if not exists public.client_number_seq start with 10001;

create or replace function public.next_client_number()
returns text
language sql
volatile
set search_path = public
as $$
  select 'RSF-C-' || nextval('public.client_number_seq')::text;
$$;

-- Least-loaded active adviser (admins are only used when no adviser exists).
create or replace function public.pick_default_adviser()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.is_active and p.role in ('adviser', 'admin')
  order by
    (p.role = 'admin'),
    (select count(*) from public.clients c where c.adviser_id = p.id),
    p.created_at
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_last text;
begin
  v_first := coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(new.email, ''), '@', 1));
  v_last := coalesce(trim(new.raw_user_meta_data ->> 'last_name'), '');

  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (new.id, new.email, v_first, v_last, nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 'client')
  on conflict (id) do update set email = excluded.email, updated_at = now();

  insert into public.clients (profile_id, client_number, adviser_id, preferred_contact_method)
  values (new.id, public.next_client_number(), public.pick_default_adviser(), 'app')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep the public profile email in step with auth.users.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.handle_user_email_change();

-- Backfill: accounts created before this trigger existed have no profile / client record.
-- Everyone is backfilled as a plain client; promote staff afterwards.
insert into public.profiles (id, email, first_name, last_name, role)
select
  u.id,
  u.email,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(u.email, ''), '@', 1)),
  coalesce(trim(u.raw_user_meta_data ->> 'last_name'), ''),
  'client'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.clients (profile_id, client_number, adviser_id, preferred_contact_method)
select p.id, public.next_client_number(), public.pick_default_adviser(), 'app'
from public.profiles p
where p.role = 'client'
  and not exists (select 1 from public.clients c where c.profile_id = p.id);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.next_client_number() from public, anon, authenticated;
revoke execute on function public.pick_default_adviser() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
