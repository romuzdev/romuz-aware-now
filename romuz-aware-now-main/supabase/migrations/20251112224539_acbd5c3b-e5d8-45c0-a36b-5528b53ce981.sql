
-- Fix fn_tenant_notify_channels to use 'integration' instead of 'webhook'
CREATE OR REPLACE FUNCTION public.fn_tenant_notify_channels(
  p_tenant_id uuid,
  p_message text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

    -- simulate notifications - FIXED: using 'integration' instead of 'webhook'
    insert into public.tenant_lifecycle_log(tenant_id, from_state, to_state, reason, triggered_by, trigger_source)
    values (p_tenant_id, null, null, concat('Notification sent via ', v_channel), 'system', 'integration');
  end loop;
end;
$function$;
