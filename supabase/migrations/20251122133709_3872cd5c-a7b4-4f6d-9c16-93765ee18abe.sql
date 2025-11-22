-- ========================================
-- Phase 1: Security Enhancements
-- Transaction Logging + Backup Metadata
-- ========================================

-- 1️⃣ Create transaction_log table
CREATE TABLE IF NOT EXISTS public.transaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_summary TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_transaction_log_tenant ON public.transaction_log(tenant_id);
CREATE INDEX idx_transaction_log_table_record ON public.transaction_log(table_name, record_id);
CREATE INDEX idx_transaction_log_changed_at ON public.transaction_log(changed_at DESC);
CREATE INDEX idx_transaction_log_changed_by ON public.transaction_log(changed_by);

-- Enable RLS
ALTER TABLE public.transaction_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant transaction logs"
  ON public.transaction_log
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- 2️⃣ Add last_backed_up_at to critical tables
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE public.grc_risks ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE public.grc_audits ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE public.objectives ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

-- Add indexes for backup tracking
CREATE INDEX IF NOT EXISTS idx_policies_backed_up ON public.policies(last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grc_risks_backed_up ON public.grc_risks(last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_backed_up ON public.documents(last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grc_audits_backed_up ON public.grc_audits(last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_committees_backed_up ON public.committees(last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_objectives_backed_up ON public.objectives(last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- 3️⃣ Create generic trigger function for transaction logging
CREATE OR REPLACE FUNCTION public.log_transaction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_changed_by UUID;
  v_old_data JSONB;
  v_new_data JSONB;
  v_change_summary TEXT;
BEGIN
  -- Get user ID
  v_changed_by := auth.uid();
  
  -- Skip if no user (system operations)
  IF v_changed_by IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Determine tenant_id
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD.tenant_id;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_change_summary := 'Record deleted';
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := NEW.tenant_id;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_change_summary := 'Record created';
  ELSE -- UPDATE
    v_tenant_id := NEW.tenant_id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_change_summary := 'Record updated';
  END IF;

  -- Insert transaction log
  INSERT INTO public.transaction_log (
    tenant_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_by,
    changed_at,
    change_summary
  ) VALUES (
    v_tenant_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old_data,
    v_new_data,
    v_changed_by,
    now(),
    v_change_summary
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the main operation
    RAISE WARNING 'Transaction log failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4️⃣ Create triggers for critical tables
-- Policies
DROP TRIGGER IF EXISTS trg_policies_transaction_log ON public.policies;
CREATE TRIGGER trg_policies_transaction_log
  AFTER INSERT OR UPDATE OR DELETE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_change();

-- GRC Risks
DROP TRIGGER IF EXISTS trg_grc_risks_transaction_log ON public.grc_risks;
CREATE TRIGGER trg_grc_risks_transaction_log
  AFTER INSERT OR UPDATE OR DELETE ON public.grc_risks
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_change();

-- Documents
DROP TRIGGER IF EXISTS trg_documents_transaction_log ON public.documents;
CREATE TRIGGER trg_documents_transaction_log
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_change();

-- GRC Audits
DROP TRIGGER IF EXISTS trg_grc_audits_transaction_log ON public.grc_audits;
CREATE TRIGGER trg_grc_audits_transaction_log
  AFTER INSERT OR UPDATE OR DELETE ON public.grc_audits
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_change();

-- Committees
DROP TRIGGER IF EXISTS trg_committees_transaction_log ON public.committees;
CREATE TRIGGER trg_committees_transaction_log
  AFTER INSERT OR UPDATE OR DELETE ON public.committees
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_change();

-- Objectives
DROP TRIGGER IF EXISTS trg_objectives_transaction_log ON public.objectives;
CREATE TRIGGER trg_objectives_transaction_log
  AFTER INSERT OR UPDATE OR DELETE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_change();

-- 5️⃣ Create helper function to get transaction history
CREATE OR REPLACE FUNCTION public.get_transaction_history(
  p_table_name TEXT,
  p_record_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  operation TEXT,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ,
  change_summary TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tl.id,
    tl.operation,
    tl.old_data,
    tl.new_data,
    tl.changed_by,
    tl.changed_at,
    tl.change_summary
  FROM public.transaction_log tl
  WHERE tl.table_name = p_table_name
    AND tl.record_id = p_record_id
    AND tl.tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  ORDER BY tl.changed_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_transaction_history(TEXT, UUID, INT) TO authenticated;

COMMENT ON TABLE public.transaction_log IS 'Logs all changes to critical tables for audit and recovery purposes';
COMMENT ON FUNCTION public.log_transaction_change() IS 'Generic trigger function to log table changes';
COMMENT ON FUNCTION public.get_transaction_history(TEXT, UUID, INT) IS 'Retrieves transaction history for a specific record';