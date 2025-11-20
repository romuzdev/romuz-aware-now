-- ============================================================================
-- Fix: Audit Trigger - Handle tables without created_by/updated_by columns
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_actor uuid;
  v_tenant_id uuid;
  v_entity text := TG_TABLE_NAME::text;
  v_diff jsonb;
  v_has_tenant_column boolean;
  v_has_created_by boolean;
  v_has_updated_by boolean;
begin
  -- محاولة الحصول على actor من session
  v_actor := app_current_user_id();
  
  -- التحقق من وجود الأعمدة
  SELECT 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = TG_TABLE_NAME AND column_name = 'tenant_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = TG_TABLE_NAME AND column_name = 'created_by'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = TG_TABLE_NAME AND column_name = 'updated_by')
  INTO v_has_tenant_column, v_has_created_by, v_has_updated_by;
  
  -- إذا لم يكن هناك session، محاولة الحصول على actor من الصف
  if v_actor IS NULL then
    if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
      if v_has_created_by then
        EXECUTE format('SELECT ($1).created_by') INTO v_actor USING new;
      end if;
      if v_actor IS NULL and v_has_updated_by then
        EXECUTE format('SELECT ($1).updated_by') INTO v_actor USING new;
      end if;
    elsif TG_OP = 'DELETE' then
      if v_has_created_by then
        EXECUTE format('SELECT ($1).created_by') INTO v_actor USING old;
      end if;
      if v_actor IS NULL and v_has_updated_by then
        EXECUTE format('SELECT ($1).updated_by') INTO v_actor USING old;
      end if;
    end if;
  end if;
  
  -- تجاهل العملية إذا لم نتمكن من تحديد actor
  if v_actor IS NULL then
    return case when TG_OP = 'DELETE' then old else new end;
  end if;

  -- تحديد tenant_id
  if v_has_tenant_column then
    if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
      EXECUTE format('SELECT ($1).tenant_id') INTO v_tenant_id USING new;
    elsif TG_OP = 'DELETE' then
      EXECUTE format('SELECT ($1).tenant_id') INTO v_tenant_id USING old;
    end if;
  end if;
  
  v_tenant_id := coalesce(v_tenant_id, app_current_tenant_id(), '00000000-0000-0000-0000-000000000000'::uuid);

  if TG_OP = 'INSERT' then
    insert into public.audit_log(entity_type, entity_id, action, actor, tenant_id, created_at, payload)
    values (v_entity, new.id, 'INSERT', v_actor, v_tenant_id, now(), to_jsonb(new));
    return new;
  elsif TG_OP = 'UPDATE' then
    v_diff := jsonb_strip_nulls(to_jsonb(new)) - 'updated_at' - 'updated_by'
           || jsonb_build_object('_old', jsonb_strip_nulls(to_jsonb(old)) - 'updated_at' - 'updated_by');
    insert into public.audit_log(entity_type, entity_id, action, actor, tenant_id, created_at, payload)
    values (v_entity, new.id, 'UPDATE', v_actor, v_tenant_id, now(), v_diff);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_log(entity_type, entity_id, action, actor, tenant_id, created_at, payload)
    values (v_entity, old.id, 'DELETE', v_actor, v_tenant_id, now(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$function$;

COMMENT ON FUNCTION public.fn_write_audit_log() IS 
'Audit trigger function that logs all INSERT/UPDATE/DELETE operations. 
Dynamically handles tables with varying column structures (tenant_id, created_by, updated_by).';