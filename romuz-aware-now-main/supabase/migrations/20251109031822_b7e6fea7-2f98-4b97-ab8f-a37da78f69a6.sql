-- Migration: D3_Part6.6_audit_log_secure
-- Create secure audit log table with tenant-aware RLS

-- 1) Create table (idempotent and secure)
CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL,
  entity_type TEXT NOT NULL,        -- e.g., 'campaign'
  entity_id  UUID NOT NULL,         -- awareness_campaigns.id
  action     TEXT NOT NULL,         -- 'campaign.created' | 'campaign.updated' | ...
  actor      UUID NOT NULL,         -- auth user id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload    JSONB
);

-- 2) FK to tenants (avoid FK to auth.users by design)
DO $$ BEGIN
  ALTER TABLE audit_log
    ADD CONSTRAINT audit_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant
  ON audit_log (tenant_id, created_at DESC);

-- 4) RLS based on existing function get_user_tenant_id(auth.uid())
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS audit_read ON audit_log;
  CREATE POLICY audit_read ON audit_log
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));
EXCEPTION WHEN undefined_function THEN
  RAISE EXCEPTION 'Missing function get_user_tenant_id(auth.uid()) required for tenant scoping';
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS audit_insert ON audit_log;
  CREATE POLICY audit_insert ON audit_log
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id = get_user_tenant_id(auth.uid())
  );
EXCEPTION WHEN undefined_function THEN
  RAISE EXCEPTION 'Missing function get_user_tenant_id(auth.uid()) required for tenant scoping';
END $$;