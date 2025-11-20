-- ============================================================================
-- M23 - Week 7-8: Phase 3 - PITR Rollback Mechanism (Part 1: Schema)
-- Purpose: Enable rollback capability for PITR restore operations
-- Critical Feature: Pre-restore snapshots + rollback functionality
-- ============================================================================

-- Create table for pre-restore snapshots
CREATE TABLE IF NOT EXISTS public.backup_pitr_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Restore operation tracking
    restore_log_id uuid REFERENCES backup_restore_logs(id) ON DELETE SET NULL,
    snapshot_name text NOT NULL,
    snapshot_type text NOT NULL DEFAULT 'pre_restore',
    
    -- Snapshot metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by text NOT NULL,
    expires_at timestamptz,
    
    -- Snapshot data
    snapshot_data jsonb NOT NULL,
    affected_tables text[] NOT NULL,
    total_rows_count bigint,
    snapshot_size_bytes bigint,
    
    -- Rollback tracking
    is_rolled_back boolean DEFAULT false,
    rolled_back_at timestamptz,
    rolled_back_by text,
    rollback_notes text,
    
    -- Status and metadata
    status text NOT NULL DEFAULT 'active',
    compression_used boolean DEFAULT false,
    storage_path text,
    checksum text,
    metadata jsonb DEFAULT '{}'::jsonb,
    
    CONSTRAINT valid_snapshot_type CHECK (snapshot_type IN ('pre_restore', 'manual', 'automated')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'rolled_back', 'archived'))
);

-- Enable RLS
ALTER TABLE public.backup_pitr_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_select_pitr_snapshots" ON public.backup_pitr_snapshots
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_pitr_snapshots" ON public.backup_pitr_snapshots
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_update_pitr_snapshots" ON public.backup_pitr_snapshots
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_pitr_snapshots_tenant ON public.backup_pitr_snapshots(tenant_id);
CREATE INDEX idx_pitr_snapshots_restore_log ON public.backup_pitr_snapshots(restore_log_id);
CREATE INDEX idx_pitr_snapshots_created ON public.backup_pitr_snapshots(created_at DESC);
CREATE INDEX idx_pitr_snapshots_status ON public.backup_pitr_snapshots(status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.backup_pitr_snapshots TO authenticated;

COMMENT ON TABLE public.backup_pitr_snapshots IS
'Pre-restore snapshots for PITR rollback capability - enables undo of restore operations';

-- Create rollback history table
CREATE TABLE IF NOT EXISTS public.backup_pitr_rollback_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Rollback operation
    snapshot_id uuid NOT NULL REFERENCES backup_pitr_snapshots(id) ON DELETE CASCADE,
    restore_log_id uuid REFERENCES backup_restore_logs(id) ON DELETE SET NULL,
    
    -- Operation details
    rollback_started_at timestamptz NOT NULL DEFAULT now(),
    rollback_completed_at timestamptz,
    duration_seconds integer,
    
    -- Status and metrics
    status text NOT NULL DEFAULT 'in_progress',
    rows_restored bigint,
    tables_affected text[],
    errors_encountered integer DEFAULT 0,
    error_details jsonb,
    
    -- Audit
    initiated_by text NOT NULL,
    reason text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    
    CONSTRAINT valid_rollback_status CHECK (status IN ('in_progress', 'completed', 'failed', 'partial'))
);

-- Enable RLS
ALTER TABLE public.backup_pitr_rollback_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_select_rollback_history" ON public.backup_pitr_rollback_history
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_rollback_history" ON public.backup_pitr_rollback_history
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Indexes
CREATE INDEX idx_rollback_history_tenant ON public.backup_pitr_rollback_history(tenant_id);
CREATE INDEX idx_rollback_history_snapshot ON public.backup_pitr_rollback_history(snapshot_id);
CREATE INDEX idx_rollback_history_status ON public.backup_pitr_rollback_history(status);

GRANT SELECT, INSERT ON public.backup_pitr_rollback_history TO authenticated;

COMMENT ON TABLE public.backup_pitr_rollback_history IS
'History of PITR rollback operations - audit trail for restore reversals';