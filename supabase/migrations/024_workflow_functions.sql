-- Migration 024: Workflow functions shared by the client app and the adviser dashboard.
-- Every state change that touches more than one row (request + workflow steps + tasks +
-- notifications, claim + timeline, ...) is a single SECURITY DEFINER function so that both
-- sides always see a consistent picture. All functions authorise the caller explicitly.

-- ---------------------------------------------------------------------------------------------
-- Client: submit a service request
-- ---------------------------------------------------------------------------------------------
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
    v_adviser uuid;
    v_assigned uuid;
    v_request_id uuid;
    v_number text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client' using errcode = '42501';
    end if;
    if length(trim(coalesce(p_title, ''))) < 3 then
        raise exception 'A request title of at least 3 characters is required';
    end if;

    select adviser_id into v_adviser from public.clients where id = v_client_id;
    v_assigned := coalesce(v_adviser, public.pick_default_adviser());

    v_number := 'RSF-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    insert into public.requests (
        client_id, created_by, assigned_to, request_number, request_type,
        title, description, status, priority, due_date, metadata
    ) values (
        v_client_id, auth.uid(), v_assigned, v_number, p_request_type,
        trim(p_title), nullif(trim(coalesce(p_description, '')), ''), 'submitted', p_priority,
        now() + interval '3 days', coalesce(p_metadata, '{}'::jsonb)
    ) returning id into v_request_id;

    -- Step 1 is done by submitting; step 2 (adviser review) starts immediately.
    insert into public.request_workflows (request_id, step_number, step_key, step_name, status, started_at, completed_at, notes)
    values
      (v_request_id, 1, 'submitted', 'Request submitted', 'completed', now(), now(), 'Submitted via the Royal Square client portal.'),
      (v_request_id, 2, 'review', 'Royal Square review', 'in_progress', now(), null, null),
      (v_request_id, 3, 'processing', 'Processing with provider', 'pending', null, null, null),
      (v_request_id, 4, 'complete', 'Completed and delivered', 'pending', null, null, null);

    if v_assigned is not null then
        insert into public.tasks (client_id, assigned_to, request_id, title, description, priority, due_date)
        values (v_client_id, v_assigned, v_request_id, 'Review request ' || v_number || ': ' || trim(p_title),
                nullif(trim(coalesce(p_description, '')), ''), p_priority, now() + interval '3 days');

        insert into public.notifications (user_id, notification_type, channel, title, body, request_id)
        values (v_assigned, 'request', 'in_app', 'New service request ' || v_number, trim(p_title), v_request_id);
    end if;

    return v_request_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Client: report a motor accident
-- ---------------------------------------------------------------------------------------------
drop function if exists public.create_motor_claim(timestamptz, text, text, text, text, uuid);

create or replace function public.create_motor_claim(
    p_incident_date timestamptz,
    p_incident_location text,
    p_incident_description text,
    p_police_case_number text default null,
    p_police_station text default null,
    p_provider_id uuid default null,
    p_insured_vehicle text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client_id uuid;
    v_adviser uuid;
    v_assigned uuid;
    v_provider uuid;
    v_claim_id uuid;
    v_number text;
    v_case text;
begin
    v_client_id := public.current_client_id();
    if v_client_id is null then
        raise exception 'Authenticated user is not linked to a client' using errcode = '42501';
    end if;
    if length(trim(coalesce(p_incident_location, ''))) = 0 or length(trim(coalesce(p_incident_description, ''))) = 0 then
        raise exception 'Incident location and description are required';
    end if;

    select adviser_id into v_adviser from public.clients where id = v_client_id;
    v_assigned := coalesce(v_adviser, public.pick_default_adviser());

    -- Default the insurer to the provider on the client's active motor policy.
    v_provider := p_provider_id;
    if v_provider is null then
        select provider_id into v_provider
        from public.policies
        where client_id = v_client_id and status = 'active' and provider_id is not null
          and policy_type ilike '%motor%'
        order by created_at desc
        limit 1;
    end if;

    v_number := 'CLM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    v_case := nullif(trim(coalesce(p_police_case_number, '')), '');

    insert into public.claims (
        client_id, created_by, assigned_to, provider_id, claim_number, claim_type,
        status, incident_date, incident_location, incident_description,
        police_reported, police_case_number, police_station, hire_car_required, metadata
    ) values (
        v_client_id, auth.uid(), v_assigned, v_provider, v_number, 'motor',
        'reported', coalesce(p_incident_date, now()), trim(p_incident_location), trim(p_incident_description),
        v_case is not null, v_case, nullif(trim(coalesce(p_police_station, '')), ''), false,
        jsonb_strip_nulls(jsonb_build_object('insured_vehicle', nullif(trim(coalesce(p_insured_vehicle, '')), '')))
    ) returning id into v_claim_id;

    insert into public.claim_timeline (claim_id, created_by, status, title, description, is_client_visible)
    values (v_claim_id, auth.uid(), 'reported', 'Accident reported', 'Incident at ' || trim(p_incident_location) || '. Your adviser has been alerted.', true);

    if v_assigned is not null then
        insert into public.tasks (client_id, assigned_to, claim_id, title, description, priority, due_date)
        values (v_client_id, v_assigned, v_claim_id, 'Triage motor claim ' || v_number, trim(p_incident_description), 'urgent', now() + interval '1 day');

        insert into public.notifications (user_id, notification_type, channel, title, body, claim_id)
        values (v_assigned, 'claim', 'in_app', 'New motor claim ' || v_number, trim(p_incident_location), v_claim_id);
    end if;

    return v_claim_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Staff: move a claim to a new stage (timeline entry + client notification come from triggers)
-- ---------------------------------------------------------------------------------------------
create or replace function public.update_claim_status(
    p_claim_id uuid,
    p_status public.claim_status,
    p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may update claim status' using errcode = '42501';
    end if;

    perform set_config('rsf.status_note', coalesce(p_description, ''), true);

    update public.claims
    set status = p_status,
        assigned_to = coalesce(assigned_to, auth.uid())
    where id = p_claim_id;

    if not found then
        raise exception 'Claim not found';
    end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Staff: progress a request
-- ---------------------------------------------------------------------------------------------
create or replace function public.advance_request_workflow(
    p_request_id uuid,
    p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_request public.requests%rowtype;
    v_current public.request_workflows%rowtype;
    v_next_id uuid;
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may progress requests' using errcode = '42501';
    end if;

    select * into v_request from public.requests where id = p_request_id for update;
    if not found then
        raise exception 'Request not found';
    end if;
    if v_request.status in ('completed', 'cancelled') then
        raise exception 'Request is already %', v_request.status;
    end if;

    select * into v_current
    from public.request_workflows
    where request_id = p_request_id and status in ('pending', 'in_progress')
    order by step_number
    limit 1;

    if not found then
        update public.requests set status = 'completed' where id = p_request_id;
        return;
    end if;

    update public.request_workflows
    set status = 'completed',
        started_at = coalesce(started_at, now()),
        completed_at = now(),
        notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes)
    where id = v_current.id;

    select id into v_next_id
    from public.request_workflows
    where request_id = p_request_id and step_number > v_current.step_number and status = 'pending'
    order by step_number
    limit 1;

    if v_next_id is not null then
        update public.request_workflows set status = 'in_progress', started_at = now() where id = v_next_id;
        update public.requests
        set status = 'in_progress', assigned_to = coalesce(assigned_to, auth.uid())
        where id = p_request_id;
    else
        update public.requests set status = 'completed' where id = p_request_id;
    end if;
end;
$$;

-- Staff: park a request (waiting on client / provider), cancel it, or reopen it.
create or replace function public.set_request_status(
    p_request_id uuid,
    p_status public.request_status,
    p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may change request status' using errcode = '42501';
    end if;

    update public.requests set status = p_status where id = p_request_id;
    if not found then
        raise exception 'Request not found';
    end if;

    if nullif(trim(coalesce(p_note, '')), '') is not null then
        update public.request_workflows
        set notes = trim(p_note)
        where id = (
            select id from public.request_workflows
            where request_id = p_request_id and status in ('in_progress', 'pending')
            order by step_number limit 1
        );
    end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Reminders
-- ---------------------------------------------------------------------------------------------
create or replace function public.complete_reminder(p_reminder_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_r public.reminders%rowtype;
    v_step interval;
    v_next timestamptz;
begin
    if not public.is_staff() then
        raise exception 'Only Royal Square staff may action reminders' using errcode = '42501';
    end if;

    select * into v_r from public.reminders where id = p_reminder_id for update;
    if not found then
        raise exception 'Reminder not found';
    end if;

    v_step := case v_r.frequency
        when 'monthly' then interval '1 month'
        when 'quarterly' then interval '3 months'
        when 'six_monthly' then interval '6 months'
        when 'yearly' then interval '1 year'
        when 'every_two_years' then interval '2 years'
        else null
    end;

    if v_step is null then
        update public.reminders set is_completed = true, completed_at = now() where id = p_reminder_id;
    else
        -- recurring: always move on at least one period, then catch up to the future
        v_next := v_r.reminder_date + v_step;
        while v_next <= now() loop
            v_next := v_next + v_step;
        end loop;
        update public.reminders set reminder_date = v_next, last_notified_at = null, completed_at = now() where id = p_reminder_id;
    end if;
end;
$$;

-- Notify client / adviser about reminders that fall due within 48 hours. Intended for pg_cron or a
-- scheduled edge function using the service role; it is not callable by API users.
create or replace function public.process_due_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count integer := 0;
    r record;
begin
    for r in
        select rem.id, rem.title, rem.description, rem.notify_client, rem.notify_adviser,
               c.profile_id as client_profile, coalesce(c.adviser_id, rem.created_by) as adviser_profile
        from public.reminders rem
        join public.clients c on c.id = rem.client_id
        where not rem.is_completed
          and rem.last_notified_at is null
          and rem.reminder_date <= now() + interval '48 hours'
        for update of rem
    loop
        if r.notify_client and r.client_profile is not null then
            insert into public.notifications (user_id, notification_type, channel, title, body, reminder_id)
            values (r.client_profile, 'reminder', 'in_app', r.title, r.description, r.id);
        end if;
        if r.notify_adviser and r.adviser_profile is not null then
            insert into public.notifications (user_id, notification_type, channel, title, body, reminder_id)
            values (r.adviser_profile, 'reminder', 'in_app', 'Reminder due: ' || r.title, r.description, r.id);
        end if;
        update public.reminders set last_notified_at = now() where id = r.id;
        v_count := v_count + 1;
    end loop;
    return v_count;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Messaging (one thread per client)
-- ---------------------------------------------------------------------------------------------
create or replace function public.send_message(
    p_body text,
    p_client_id uuid default null,
    p_subject text default null,
    p_request_id uuid default null,
    p_claim_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client public.clients%rowtype;
    v_staff boolean;
    v_id uuid;
begin
    if length(trim(coalesce(p_body, ''))) = 0 then
        raise exception 'Message body is required';
    end if;

    v_staff := public.is_staff();
    if v_staff then
        select * into v_client from public.clients where id = p_client_id;
    else
        select * into v_client from public.clients where profile_id = auth.uid();
    end if;
    if not found then
        raise exception 'Client not found' using errcode = '42501';
    end if;

    if p_request_id is not null and not exists (select 1 from public.requests where id = p_request_id and client_id = v_client.id) then
        raise exception 'Request does not belong to this client';
    end if;
    if p_claim_id is not null and not exists (select 1 from public.claims where id = p_claim_id and client_id = v_client.id) then
        raise exception 'Claim does not belong to this client';
    end if;

    insert into public.messages (client_id, sender_id, recipient_id, request_id, claim_id, direction, subject, body)
    values (
        v_client.id, auth.uid(),
        case when v_staff then v_client.profile_id else v_client.adviser_id end,
        p_request_id, p_claim_id,
        case when v_staff then 'royal_to_client'::public.message_direction else 'client_to_royal'::public.message_direction end,
        nullif(trim(coalesce(p_subject, '')), ''), trim(p_body)
    ) returning id into v_id;

    if v_staff then
        insert into public.notifications (user_id, notification_type, channel, title, body)
        values (v_client.profile_id, 'message', 'in_app', 'New message from Royal Square', left(trim(p_body), 200));
    elsif v_client.adviser_id is not null then
        insert into public.notifications (user_id, notification_type, channel, title, body)
        values (v_client.adviser_id, 'message', 'in_app', 'New client message', left(trim(p_body), 200));
    else
        insert into public.notifications (user_id, notification_type, channel, title, body)
        select id, 'message', 'in_app', 'New client message', left(trim(p_body), 200)
        from public.profiles where is_active and role in ('adviser', 'admin');
    end if;

    return v_id;
end;
$$;

create or replace function public.mark_thread_read(p_client_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_client uuid;
begin
    if public.is_staff() then
        update public.messages
        set is_read = true, read_at = now()
        where client_id = p_client_id and direction = 'client_to_royal' and not is_read;
    else
        v_client := public.current_client_id();
        update public.messages
        set is_read = true, read_at = now()
        where client_id = v_client and direction = 'royal_to_client' and not is_read;
    end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Administration
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_set_user_role(
    p_user_id uuid,
    p_role public.user_role,
    p_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Only administrators may change roles' using errcode = '42501';
    end if;
    if p_user_id = auth.uid() and (p_role <> 'admin' or coalesce(p_is_active, true) = false) then
        raise exception 'You cannot demote or deactivate your own account';
    end if;

    update public.profiles
    set role = p_role, is_active = coalesce(p_is_active, is_active)
    where id = p_user_id;
    if not found then
        raise exception 'User not found';
    end if;

    if p_role = 'client' then
        insert into public.clients (profile_id, client_number, adviser_id, preferred_contact_method)
        values (p_user_id, public.next_client_number(), public.pick_default_adviser(), 'app')
        on conflict (profile_id) do nothing;
    else
        -- A staff member has no client file; only drop it while it is still empty.
        delete from public.clients c
        where c.profile_id = p_user_id
          and not exists (select 1 from public.requests where client_id = c.id)
          and not exists (select 1 from public.claims where client_id = c.id)
          and not exists (select 1 from public.documents where client_id = c.id)
          and not exists (select 1 from public.policies where client_id = c.id)
          and not exists (select 1 from public.investments where client_id = c.id)
          and not exists (select 1 from public.assets where client_id = c.id);
    end if;

    -- Clients of someone who is no longer an adviser are handed to the least-loaded adviser.
    if p_role not in ('adviser', 'admin') or coalesce(p_is_active, true) = false then
        update public.clients set adviser_id = public.pick_default_adviser() where adviser_id = p_user_id;
    end if;
end;
$$;

create or replace function public.assign_client_adviser(p_client_id uuid, p_adviser_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Only administrators may reassign clients' using errcode = '42501';
    end if;
    if not exists (select 1 from public.profiles where id = p_adviser_id and is_active and role in ('adviser', 'admin')) then
        raise exception 'Target user is not an active adviser';
    end if;

    update public.clients set adviser_id = p_adviser_id where id = p_client_id;
    if not found then
        raise exception 'Client not found';
    end if;

    update public.requests set assigned_to = p_adviser_id where client_id = p_client_id and status not in ('completed', 'cancelled');
    update public.claims set assigned_to = p_adviser_id where client_id = p_client_id and status not in ('completed', 'rejected', 'cancelled');
    update public.tasks set assigned_to = p_adviser_id where client_id = p_client_id and status in ('pending', 'in_progress');

    insert into public.notifications (user_id, notification_type, channel, title, body)
    select p_adviser_id, 'system', 'in_app', 'Client assigned to you',
           coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), c.client_number)
    from public.clients c join public.profiles p on p.id = c.profile_id
    where c.id = p_client_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------------------------
revoke execute on function public.create_client_request(public.request_type, text, text, public.request_priority, jsonb) from public, anon;
revoke execute on function public.create_motor_claim(timestamptz, text, text, text, text, uuid, text) from public, anon;
revoke execute on function public.update_claim_status(uuid, public.claim_status, text) from public, anon;
revoke execute on function public.advance_request_workflow(uuid, text) from public, anon;
revoke execute on function public.set_request_status(uuid, public.request_status, text) from public, anon;
revoke execute on function public.complete_reminder(uuid) from public, anon;
revoke execute on function public.process_due_reminders() from public, anon, authenticated;
revoke execute on function public.send_message(text, uuid, text, uuid, uuid) from public, anon;
revoke execute on function public.mark_thread_read(uuid) from public, anon;
revoke execute on function public.admin_set_user_role(uuid, public.user_role, boolean) from public, anon;
revoke execute on function public.assign_client_adviser(uuid, uuid) from public, anon;

grant execute on function public.create_client_request(public.request_type, text, text, public.request_priority, jsonb) to authenticated;
grant execute on function public.create_motor_claim(timestamptz, text, text, text, text, uuid, text) to authenticated;
grant execute on function public.update_claim_status(uuid, public.claim_status, text) to authenticated;
grant execute on function public.advance_request_workflow(uuid, text) to authenticated;
grant execute on function public.set_request_status(uuid, public.request_status, text) to authenticated;
grant execute on function public.complete_reminder(uuid) to authenticated;
grant execute on function public.process_due_reminders() to service_role;
grant execute on function public.send_message(text, uuid, text, uuid, uuid) to authenticated;
grant execute on function public.mark_thread_read(uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.user_role, boolean) to authenticated;
grant execute on function public.assign_client_adviser(uuid, uuid) to authenticated;

-- Schedule reminder processing hourly when pg_cron is available (Supabase: enable the extension first).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('process-due-reminders', '0 * * * *', 'select public.process_due_reminders()');
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end $$;
