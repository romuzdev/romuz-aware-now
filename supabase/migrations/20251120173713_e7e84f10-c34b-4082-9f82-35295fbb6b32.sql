-- Fix audit log trigger to handle UUID properly
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb := '{}'::jsonb;
  new_data jsonb := '{}'::jsonb;
  changed_fields text[] := ARRAY[]::text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_log (
    tenant_id,
    entity_type,
    entity_id,
    action,
    actor,
    payload
  ) VALUES (
    COALESCE(
      (CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END),
      (auth.jwt() ->> 'tenant_id')::uuid
    ),
    TG_TABLE_NAME,
    (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END),  -- Keep as UUID
    lower(TG_OP),
    COALESCE(auth.jwt() ->> 'sub', 'system'),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'old_data', old_data,
      'new_data', new_data,
      'changed_fields', changed_fields,
      'timestamp', now()
    )
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;