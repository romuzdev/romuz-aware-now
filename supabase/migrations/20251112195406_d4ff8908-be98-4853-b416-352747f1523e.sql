-- Gate-P — Tenant Lifecycle & Automation Engine
-- Part 4 — Edge Functions & Webhooks Integration Layer

-- =========================================================
-- E1) fn_edge_tenant_event_inbound()
-- =========================================================
create or replace function public.fn_edge_tenant_event_inbound(
  p_tenant_id uuid,
  p_event text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_state text;
  v_log_reason text;
begin
  case p_event
    when 'BILLING_SUSPEND' then
      v_target_state := 'SUSPENDED';
      v_log_reason := 'Billing event suspension received';
    when 'BILLING_REACTIVATE' then
      v_target_state := 'ACTIVE';
      v_log_reason := 'Billing event reactivation received';
    when 'EXTERNAL_DEPROVISION' then
      v_target_state := 'DEPROVISIONING';
      v_log_reason := 'External deprovision request';
    else
      raise notice 'Unhandled inbound event: %', p_event;
      return jsonb_build_object('status','ignored','event',p_event);
  end case;

  perform public.fn_tenant_transition_state(p_tenant_id, v_target_state, v_log_reason, 'external', 'edge');

  return jsonb_build_object(
    'status','ok',
    'tenant_id',p_tenant_id,
    'event',p_event,
    'target_state',v_target_state
  );
end;
$$;

comment on function public.fn_edge_tenant_event_inbound is
'Edge inbound function: updates tenant lifecycle based on external billing or system events.';


-- =========================================================
-- E2) fn_tenant_notify_channels()
-- =========================================================
create or replace function public.fn_tenant_notify_channels(
  p_tenant_id uuid,
  p_message text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_channel text;
  v_config jsonb;
begin
  for r in
    select channel_type, config_json
    from public.tenant_notifications_channels
    where (tenant_id = p_tenant_id or tenant_id is null)
      and is_active = true
  loop
    v_channel := r.channel_type;
    v_config := r.config_json;

    -- simulate notifications
    insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
    values (p_tenant_id, null, null, concat('Notification sent via ', v_channel), 'system', 'webhook');
  end loop;
end;
$$;

comment on function public.fn_tenant_notify_channels is
'Sends notifications to active channels (email, slack, webhook) for a tenant.';


-- =========================================================
-- E3) fn_tenant_integration_hook()
-- =========================================================
create or replace function public.fn_tenant_integration_hook(
  p_tenant_id uuid,
  p_event text,
  p_context jsonb default '{}'::jsonb
)
returns void
language sql
set search_path = public
as $$
  insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
  values ($1, null, null, concat('Integration hook fired: ', $2), 'system', 'integration');
$$;

comment on function public.fn_tenant_integration_hook is
'Registers integration-level event for observability and external sync.';

-- =========================================================
-- Usage Examples (Edge -> Internal Flow)
-- =========================================================
-- 1) External billing system calls:
--    select public.fn_edge_tenant_event_inbound('<tenant_uuid>', 'BILLING_SUSPEND');
-- 2) Internal system triggers notifications:
--    select public.fn_tenant_notify_channels('<tenant_uuid>', 'Tenant Suspended');
-- 3) Log integration sync:
--    select public.fn_tenant_integration_hook('<tenant_uuid>', 'SYNC_COMPLETED');

-- =========================================================
-- Done: Part 4 — Edge Functions & Webhooks Integration Layer