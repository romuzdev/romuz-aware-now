-- ============================================================================
-- M23 - Option 2: PITR Data Restoration Logic (Part 1: Schema Enhancement)
-- Purpose: Add fields and functions needed for actual data restoration
-- ============================================================================

-- Add restoration tracking fields to pitr_rollback_history
ALTER TABLE public.backup_pitr_rollback_history
ADD COLUMN IF NOT EXISTS restoration_steps jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_step text,
ADD COLUMN IF NOT EXISTS tables_restored text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS fk_constraints_handled jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS transaction_ids text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.backup_pitr_rollback_history.restoration_steps IS
'Array of restoration steps with status and details';

COMMENT ON COLUMN public.backup_pitr_rollback_history.fk_constraints_handled IS
'Tracking of FK constraints that were temporarily disabled/re-enabled';

-- Create table for tracking FK constraints during restoration
CREATE TABLE IF NOT EXISTS public.backup_fk_constraints_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_schema text NOT NULL,
    table_name text NOT NULL,
    constraint_name text NOT NULL,
    constraint_definition text NOT NULL,
    is_disabled boolean DEFAULT false,
    disabled_at timestamptz,
    re_enabled_at timestamptz,
    rollback_id uuid REFERENCES backup_pitr_rollback_history(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(table_schema, table_name, constraint_name, rollback_id)
);

-- Enable RLS
ALTER TABLE public.backup_fk_constraints_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "tenant_access_fk_cache" ON public.backup_fk_constraints_cache
FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Index
CREATE INDEX idx_fk_cache_rollback ON public.backup_fk_constraints_cache(rollback_id);
CREATE INDEX idx_fk_cache_tenant ON public.backup_fk_constraints_cache(tenant_id);

GRANT ALL ON public.backup_fk_constraints_cache TO authenticated;

COMMENT ON TABLE public.backup_fk_constraints_cache IS
'Temporary cache of FK constraints during PITR rollback for safe re-application';