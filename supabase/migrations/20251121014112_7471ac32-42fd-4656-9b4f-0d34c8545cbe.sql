-- Ensure auth.uid() is cast to uuid for audit_log.actor
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (
      tenant_id,
      entity_type,
      entity_id,
      action,
      actor,
      payload
    ) VALUES (
      OLD.tenant_id,
      TG_TABLE_NAME,
      OLD.id,
      'delete',
      auth.uid()::uuid,
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (
      tenant_id,
      entity_type,
      entity_id,
      action,
      actor,
      payload
    ) VALUES (
      NEW.tenant_id,
      TG_TABLE_NAME,
      NEW.id,
      'update',
      auth.uid()::uuid,
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (
      tenant_id,
      entity_type,
      entity_id,
      action,
      actor,
      payload
    ) VALUES (
      NEW.tenant_id,
      TG_TABLE_NAME,
      NEW.id,
      'create',
      auth.uid()::uuid,
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;