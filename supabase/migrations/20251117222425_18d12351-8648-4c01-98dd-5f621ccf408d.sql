-- ============================================================================
-- Fix: Audit Trigger - Handle tables without tenant_id column
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
begin
  -- محاولة الحصول على actor من session، وإذا فشل استخدم created_by/updated_by
  v_actor := app_current_user_id();
  
  if v_actor IS NULL then
    -- إذا لم يكن هناك session، استخدم created_by أو updated_by من الصف
    if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
      v_actor := coalesce(new.created_by, new.updated_by);
    elsif TG_OP = 'DELETE' then
      v_actor := coalesce(old.created_by, old.updated_by);
    end if;
  end if;
  
  -- تجاهل العملية إذا لم نتمكن من تحديد actor
  if v_actor IS NULL then
    return case when TG_OP = 'DELETE' then old else new end;
  end if;

  -- التحقق من وجود عمود tenant_id في الجدول
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = TG_TABLE_NAME 
      AND column_name = 'tenant_id'
  ) INTO v_has_tenant_column;

  -- تحديد tenant_id بناءً على وجود العمود
  if v_has_tenant_column then
    if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
      EXECUTE format('SELECT ($1).tenant_id') INTO v_tenant_id USING new;
      v_tenant_id := coalesce(v_tenant_id, app_current_tenant_id(), '00000000-0000-0000-0000-000000000000'::uuid);
    elsif TG_OP = 'DELETE' then
      EXECUTE format('SELECT ($1).tenant_id') INTO v_tenant_id USING old;
      v_tenant_id := coalesce(v_tenant_id, app_current_tenant_id(), '00000000-0000-0000-0000-000000000000'::uuid);
    end if;
  else
    -- استخدام القيمة الافتراضية إذا لم يكن للجدول tenant_id
    v_tenant_id := coalesce(app_current_tenant_id(), '00000000-0000-0000-0000-000000000000'::uuid);
  end if;

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
Falls back to created_by/updated_by when no session context is available.
Dynamically handles tables with or without tenant_id column.';