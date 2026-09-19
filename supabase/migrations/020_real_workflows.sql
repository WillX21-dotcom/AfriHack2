-- Migration 020: Real client/admin workflow contracts

create or replace function public.create_client_request(
    p_request_type public.request_type,
    p_title text,
    p_description text default null,
    p_priority public.request_priority default 'normal',
    p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client_id uuid;
    v_request_id uuid;
    v_assigned_to uuid;
    v_request_number text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    select id into v_assigned_to
    from public.profiles
    where role in ('adviser', 'admin') and is_active = true
    order by role, created_at
    limit 1;

    v_request_number := 'RSF-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    insert into public.requests (
        client_id, created_by, assigned_to, request_number, request_type,
        title, description, status, priority, due_date, metadata
    ) values (
        v_client_id, auth.uid(), v_assigned_to, v_request_number, p_request_type,
        p_title, p_description, 'submitted', p_priority, now() + interval '3 days', coalesce(p_metadata, '{}'::jsonb)
    ) returning id into v_request_id;

    insert into public.request_workflows (request_id, step_number, step_key, step_name, status, started_at, completed_at)
    values
      (v_request_id, 1, 'submitted', 'Request submitted', 'completed', now(), now()),
      (v_request_id, 2, 'review', 'Royal Square review', 'pending', null, null),
      (v_request_id, 3, 'processing', 'Processing with provider', 'pending', null, null),
      (v_request_id, 4, 'complete', 'Completed', 'pending', null, null);

    if v_assigned_to is not null then
      insert into public.notifications (user_id, notification_type, channel, title, body, request_id)
      values (v_assigned_to, 'request', 'in_app', 'New service request', p_title, v_request_id);
    end if;

    return v_request_id;
end;
$$;

grant execute on function public.create_client_request(public.request_type, text, text, public.request_priority, jsonb) to authenticated;

create or replace function public.create_motor_claim(
    p_incident_date timestamptz,
    p_incident_location text,
    p_incident_description text,
    p_police_case_number text default null,
    p_police_station text default null,
    p_provider_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client_id uuid;
    v_claim_id uuid;
    v_assigned_to uuid;
    v_claim_number text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client';
    end if;

    select id into v_assigned_to
    from public.profiles
    where role in ('adviser', 'admin') and is_active = true
    order by role, created_at
    limit 1;

    v_claim_number := 'CLM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    insert into public.claims (
        client_id, created_by, assigned_to, provider_id, claim_number, claim_type,
        status, incident_date, incident_location, incident_description,
        police_reported, police_case_number, police_station
    ) values (
        v_client_id, auth.uid(), v_assigned_to, p_provider_id, v_claim_number, 'motor',
        'reported', p_incident_date, p_incident_location, p_incident_description,
        p_police_case_number is not null, p_police_case_number, p_police_station
    ) returning id into v_claim_id;

    insert into public.claim_timeline (claim_id, created_by, status, title, description, is_client_visible)
    values (v_claim_id, auth.uid(), 'reported', 'Accident reported', p_incident_description, true);

    if v_assigned_to is not null then
      insert into public.notifications (user_id, notification_type, channel, title, body, claim_id)
      values (v_assigned_to, 'claim', 'in_app', 'New motor claim reported', v_claim_number, v_claim_id);
    end if;

    return v_claim_id;
end;
$$;

grant execute on function public.create_motor_claim(timestamptz, text, text, text, text, uuid) to authenticated;
