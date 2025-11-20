-- Fix audit log trigger for knowledge tables (without knowledge_graph)

DROP TRIGGER IF EXISTS trg_knowledge_documents_audit ON public.knowledge_documents;
DROP TRIGGER IF EXISTS trg_knowledge_qa_audit ON public.knowledge_qa;

-- Create a fixed trigger function
CREATE OR REPLACE FUNCTION log_knowledge_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb := NULL;
  new_data jsonb := NULL;
  changed_fields text[] := '{}';
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    old_data := to_jsonb(OLD);
  END IF;
  
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    new_data := to_jsonb(NEW);
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key)
    INTO changed_fields
    FROM jsonb_each(old_data)
    WHERE old_data->key IS DISTINCT FROM new_data->key;
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
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    lower(TG_OP),
    COALESCE(auth.uid()::text, 'system'),
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

CREATE TRIGGER trg_knowledge_documents_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION log_knowledge_table_changes();

CREATE TRIGGER trg_knowledge_qa_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_qa
  FOR EACH ROW EXECUTE FUNCTION log_knowledge_table_changes();