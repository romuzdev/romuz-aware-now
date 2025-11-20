-- Fix audit log trigger - cast actor to UUID
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (tenant_id, entity_type, entity_id, action, actor, payload)
  VALUES (
    COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END)),
    TG_TABLE_NAME,
    (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END),
    lower(TG_OP),
    COALESCE((auth.jwt() ->> 'sub')::uuid, (CASE WHEN TG_OP = 'DELETE' THEN OLD.created_by ELSE NEW.created_by END)),
    jsonb_build_object('operation', TG_OP, 'timestamp', now())
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;