-- Migration 019: Stored Procedures, Functions, and Triggers
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
    select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_client_id()
returns uuid
language sql stable security definer set search_path = public as $$
    select id from public.clients where profile_id = auth.uid() limit 1;
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid()
          and role in ('adviser', 'admin', 'compliance')
          and is_active = true
    );
$$;

create or replace function public.goal_progress(p_goal_id uuid)
returns numeric
language sql stable security definer set search_path = public as $$
    select
        case
            when target_amount <= 0 then 0
            else least(100, round((current_amount / target_amount) * 100, 2))
        end
    from public.goals where id = p_goal_id;
$$;

create or replace function public.client_net_worth(p_client_id uuid)
returns numeric
language sql stable security definer set search_path = public as $$
    select
        coalesce((select sum(current_value) from public.assets where client_id = p_client_id), 0)
        + coalesce((select sum(current_value) from public.investments where client_id = p_client_id), 0)
        - coalesce((select sum(outstanding_balance) from public.liabilities where client_id = p_client_id), 0);
$$;

create or replace function public.create_client_request(
    p_request_type public.request_type,
    p_title text,
    p_description text default null,
    p_priority public.request_priority default 'normal',
    p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
    v_client_id uuid;
    v_request_id uuid;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    insert into public.requests (
        client_id, created_by, request_type, title, description, status, priority, metadata
    ) values (
        v_client_id, auth.uid(), p_request_type, p_title, p_description, 'submitted', p_priority, coalesce(p_metadata, '{}'::jsonb)
    ) returning id into v_request_id;

    return v_request_id;
end;
$$;

create or replace function public.create_motor_claim(
    p_incident_date timestamptz,
    p_incident_location text,
    p_incident_description text,
    p_provider_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
    v_client_id uuid;
    v_claim_id uuid;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    insert into public.claims (
        client_id, created_by, provider_id, claim_type, status, incident_date, incident_location, incident_description
    ) values (
        v_client_id, auth.uid(), p_provider_id, 'motor', 'reported', p_incident_date, p_incident_location, p_incident_description
    ) returning id into v_claim_id;

    return v_claim_id;
end;
$$;

create or replace function public.update_claim_status(
    p_claim_id uuid,
    p_status public.claim_status,
    p_description text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may update claim status';
    end if;

    update public.claims
    set status = p_status,
        metadata = coalesce(metadata, '{}'::jsonb) ||
            case when p_description is not null then jsonb_build_object('latest_status_description', p_description) else '{}'::jsonb end,
        updated_at = now()
    where id = p_claim_id;
end;
$$;
