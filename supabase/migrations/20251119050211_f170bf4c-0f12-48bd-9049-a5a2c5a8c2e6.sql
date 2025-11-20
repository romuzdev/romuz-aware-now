-- ================================================================
-- M14 - KPI Dashboard: Security Enhancement - Part 1
-- Create audit logging function first
-- ================================================================

-- Create audit logging function if not exists
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changed_fields jsonb;
BEGIN
  -- Determine operation type and build data
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    -- Calculate changed fields
    changed_fields := jsonb_object_agg(
      key,
      jsonb_build_object('old', old_data->key, 'new', new_data->key)
    ) FROM jsonb_each(new_data)
    WHERE new_data->key IS DISTINCT FROM old_data->key;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Insert into audit_log
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
    COALESCE(
      (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END)::text,
      'unknown'
    ),
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

  -- Return appropriate value
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_table_changes() TO authenticated;

COMMENT ON FUNCTION log_table_changes() IS 'Audit trigger function to log all table changes to audit_log table';