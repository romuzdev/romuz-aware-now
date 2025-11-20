-- Gate-P — Tenant Lifecycle & Automation Engine
-- Part 2 — RPC & Domain Logic

-- =========================================================
-- fn_tenant_transition_state()
-- =========================================================
create or replace function public.fn_tenant_transition_state(
  p_tenant_id uuid,
  p_to_state text,
  p_reason text default null,
  p_triggered_by text default 'system',
  p_trigger_source text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_state text;
  v_allowed boolean := false;
  v_transition jsonb;
begin
  -- get current state
  select status into v_from_state
  from public.tenants where id = p_tenant_id;

  if v_from_state is null then
    raise exception 'Tenant not found';
  end if;

  -- validation: allowed transitions
  if (v_from_state = 'CREATED' and p_to_state in ('PROVISIONING','ACTIVE'))
     or (v_from_state = 'ACTIVE' and p_to_state in ('SUSPENDED','READ_ONLY','DEPROVISIONING'))
     or (v_from_state = 'SUSPENDED' and p_to_state in ('ACTIVE','DEPROVISIONING'))
     or (v_from_state = 'DEPROVISIONING' and p_to_state = 'ARCHIVED')
  then
     v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Invalid transition: % → %', v_from_state, p_to_state;
  end if;

  -- update tenant status
  update public.tenants
  set status = p_to_state
  where id = p_tenant_id;

  -- log transition
  insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
  values (p_tenant_id, v_from_state, p_to_state, p_reason, p_triggered_by, p_trigger_source);

  -- fire automation event
  perform public.fn_tenant_fire_event(p_tenant_id, concat('ON_TENANT_', p_to_state));

  -- result
  v_transition := jsonb_build_object(
    'tenant_id', p_tenant_id,
    'from_state', v_from_state,
    'to_state', p_to_state,
    'timestamp', now(),
    'result', 'ok'
  );
  return v_transition;
end;
$$;

comment on function public.fn_tenant_transition_state is
'Performs state transition for a tenant, validates allowed flow, logs it, and triggers automation event.';

-- =========================================================
-- fn_tenant_log_event()
-- =========================================================
create or replace function public.fn_tenant_log_event(
  p_tenant_id uuid,
  p_from_state text,
  p_to_state text,
  p_reason text,
  p_triggered_by text default 'system'
)
returns void
language sql
set search_path = public
as $$
  insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by)
  values ($1, $2, $3, $4, $5);
$$;

comment on function public.fn_tenant_log_event is
'Logs a tenant lifecycle event manually.';

-- =========================================================
-- fn_tenant_fire_event()
-- =========================================================
create or replace function public.fn_tenant_fire_event(
  p_tenant_id uuid,
  p_event_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r_action record;
begin
  for r_action in
    select *
    from public.tenant_automation_actions
    where event_code = p_event_code
      and is_enabled = true
      and (scope = 'global' or tenant_id = p_tenant_id)
  loop
    insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
    values (p_tenant_id, null, p_event_code, 'Automation Action Triggered: '||r_action.action_type, 'system', 'job');
  end loop;
end;
$$;

comment on function public.fn_tenant_fire_event is
'Executes automation actions bound to the given event (records in log for traceability).';

-- =========================================================
-- fn_tenant_update_health()
-- =========================================================
create or replace function public.fn_tenant_update_health(
  p_tenant_id uuid,
  p_health_status text,
  p_drift_flag text default null,
  p_details_json jsonb default '{}'::jsonb
)
returns void
language sql
set search_path = public
as $$
  insert into public.tenant_health_status(tenant_id, health_status, drift_flag, details_json, last_checked_at, updated_at)
  values ($1, $2, $3, $4, now(), now())
  on conflict (tenant_id)
  do update set
    health_status = excluded.health_status,
    drift_flag = excluded.drift_flag,
    details_json = excluded.details_json,
    last_checked_at = excluded.last_checked_at,
    updated_at = now();
$$;

comment on function public.fn_tenant_update_health is
'Updates or upserts the current health & drift information of a tenant.';

-- =========================================================
-- fn_tenant_start_deprovision()
-- =========================================================
create or replace function public.fn_tenant_start_deprovision(
  p_tenant_id uuid
)
returns void
language plpgsql
set search_path = public
as $$
declare
  step record;
begin
  for step in
    select sort_order, step_code
    from public.v_default_deprovision_steps
  loop
    insert into public.tenant_deprovision_jobs(tenant_id, step_code, sort_order)
    values (p_tenant_id, step.step_code, step.sort_order)
    on conflict do nothing;
  end loop;

  -- log and transition
  perform public.fn_tenant_transition_state(p_tenant_id, 'DEPROVISIONING', 'Started deprovisioning');
end;
$$;

comment on function public.fn_tenant_start_deprovision is
'Initializes ordered deprovision steps for a tenant and transitions state to DEPROVISIONING.';

-- Done: Part 2 — RPC & Domain Logic