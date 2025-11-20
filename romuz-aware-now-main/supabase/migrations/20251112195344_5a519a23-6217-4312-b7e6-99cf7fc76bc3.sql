-- Gate-P — Tenant Lifecycle & Automation Engine
-- Part 3 — Automation Jobs & Schedules

-- =========================================================
-- J1) fn_job_check_tenant_health()
-- =========================================================
create or replace function public.fn_job_check_tenant_health()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_status text;
begin
  for r in
    select id, status from public.tenants
    where status in ('ACTIVE','SUSPENDED')
  loop
    -- simple mock health check logic
    if random() < 0.9 then
      v_status := 'HEALTHY';
    else
      v_status := 'WARNING';
    end if;

    perform public.fn_tenant_update_health(
      r.id,
      v_status,
      null,
      jsonb_build_object('source','auto','checked_at',now())
    );

    insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
    values (r.id, r.status, r.status, 'Health check executed ('||v_status||')', 'system', 'job');
  end loop;
end;
$$;

comment on function public.fn_job_check_tenant_health is
'Periodic job to check tenant health and record health status updates.';

-- =========================================================
-- J2) fn_job_detect_drift()
-- =========================================================
create or replace function public.fn_job_detect_drift()
returns void
language plpgsql
set search_path = public
as $$
declare
  r record;
  v_drift text;
begin
  for r in
    select id from public.tenants where status = 'ACTIVE'
  loop
    if random() < 0.05 then
      v_drift := 'CONFIG_DRIFT';
      perform public.fn_tenant_update_health(
        r.id,
        'WARNING',
        v_drift,
        jsonb_build_object('detected_by','auto','note','config mismatch simulated')
      );
      insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
      values (r.id, 'ACTIVE', 'ACTIVE', 'Detected drift ('||v_drift||')', 'system', 'job');
    end if;
  end loop;
end;
$$;

comment on function public.fn_job_detect_drift is
'Detects configuration or RBAC drift periodically.';

-- =========================================================
-- J3) fn_job_process_deprovision()
-- =========================================================
create or replace function public.fn_job_process_deprovision()
returns void
language plpgsql
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select tenant_id, step_code, status
    from public.tenant_deprovision_jobs
    where status = 'PENDING'
    order by sort_order
  loop
    update public.tenant_deprovision_jobs
    set status='RUNNING', started_at=now()
    where tenant_id=r.tenant_id and step_code=r.step_code;

    -- simulate step completion
    perform pg_sleep(0.1);

    update public.tenant_deprovision_jobs
    set status='DONE', completed_at=now()
    where tenant_id=r.tenant_id and step_code=r.step_code;

    insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
    values (r.tenant_id, 'DEPROVISIONING', 'DEPROVISIONING', 'Step completed: '||r.step_code, 'system', 'job');
  end loop;

  -- check if all steps are done per tenant
  update public.tenants t
  set status='ARCHIVED'
  where t.id in (
    select tenant_id
    from public.tenant_deprovision_jobs
    group by tenant_id
    having bool_and(status='DONE')
  );

  -- log finalization
  insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
  select distinct tenant_id, 'DEPROVISIONING', 'ARCHIVED', 'All deprovision steps complete', 'system', 'job'
  from public.tenant_deprovision_jobs
  where status='DONE';
end;
$$;

comment on function public.fn_job_process_deprovision is
'Processes pending deprovision steps and transitions tenant to ARCHIVED when complete.';

-- =========================================================
-- Done: Part 3 — Automation Jobs & Schedules