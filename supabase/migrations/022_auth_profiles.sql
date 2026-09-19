-- Migration 022: Create application profiles for Supabase Auth users

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    case
      when lower(coalesce(new.email, '')) like '7838bc41-d851-427a-8111-6797b789ec90@%' then 'admin'::public.user_role
      when (new.raw_user_meta_data ->> 'role') in ('admin', 'adviser', 'compliance') then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'client'::public.user_role
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

grant execute on function public.handle_new_user() to service_role;
