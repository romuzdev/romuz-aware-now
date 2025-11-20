-- Part 2.1: Gate-H — Action Plans & Follow-ups (v1)
-- Schema + Enums + Tables + Indexes + Triggers

-- ============================================================
-- 1) Create schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS gate_h;

COMMENT ON SCHEMA gate_h IS 'Gate-H: Action Plans & Follow-ups for Awareness/Culture improvements. Closed loop: recommendation → action → evidence → verification → closure.';

-- ============================================================
-- 2) Define enums for Gate-H
-- ============================================================

-- Priority levels
DO $$ BEGIN
  CREATE TYPE gate_h_action_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE gate_h_action_priority_enum IS 'Action item priority levels: low, medium, high, critical';

-- Status workflow
DO $$ BEGIN
  CREATE TYPE gate_h_action_status_enum AS ENUM ('new', 'in_progress', 'blocked', 'verify', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE gate_h_action_status_enum IS 'Action item status lifecycle: new → in_progress → blocked|verify → closed';

-- Effort estimation
DO $$ BEGIN
  CREATE TYPE gate_h_action_effort_enum AS ENUM ('S', 'M', 'L');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE gate_h_action_effort_enum IS 'Action item effort estimation: S (small), M (medium), L (large)';

-- Update types for audit trail
DO $$ BEGIN
  CREATE TYPE gate_h_action_update_type_enum AS ENUM ('comment', 'progress', 'evidence', 'status_change');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE gate_h_action_update_type_enum IS 'Types of updates on action items: comment, progress, evidence, status_change';

-- ============================================================
-- 3) Create table gate_h.action_items
-- ============================================================

CREATE TABLE IF NOT EXISTS gate_h.action_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  
  -- Source tracking (from which Gate/system)
  source              TEXT NOT NULL CHECK (source IN ('K', 'I', 'J', 'manual')),
  source_reco_id      UUID NULL,
  kpi_key             TEXT NULL,
  dim_key             TEXT NULL,
  dim_value           TEXT NULL,
  
  -- Action details
  title_ar            TEXT NOT NULL,
  desc_ar             TEXT NULL,
  
  -- Priority & Status
  priority            gate_h_action_priority_enum NOT NULL DEFAULT 'medium',
  status              gate_h_action_status_enum NOT NULL DEFAULT 'new',
  
  -- Assignment & Ownership
  assignee_user_id    UUID NULL,
  owner_user_id       UUID NULL,
  
  -- Timing
  due_date            DATE NULL,
  sla_days            INTEGER NULL CHECK (sla_days IS NULL OR sla_days > 0),
  
  -- Effort estimation
  effort              gate_h_action_effort_enum NOT NULL DEFAULT 'M',
  
  -- Tagging
  tags                TEXT[] NOT NULL DEFAULT '{}',
  
  -- Audit & lifecycle timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID NOT NULL DEFAULT app_current_user_id(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by          UUID NULL,
  verified_at         TIMESTAMPTZ NULL,
  verified_by         UUID NULL,
  closed_at           TIMESTAMPTZ NULL,
  
  -- Foreign keys
  CONSTRAINT fk_action_items_tenant FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_items_assignee FOREIGN KEY (assignee_user_id) 
    REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_action_items_owner FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_action_items_verified_by FOREIGN KEY (verified_by) 
    REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE gate_h.action_items IS 'Action items derived from Gate-K/I/J recommendations or created manually. Tracks priority, assignment, status, and verification.';
COMMENT ON COLUMN gate_h.action_items.source IS 'Source gate: K (Gate-K), I (Gate-I), J (Gate-J), or manual';
COMMENT ON COLUMN gate_h.action_items.source_reco_id IS 'References the original recommendation ID from source gate';
COMMENT ON COLUMN gate_h.action_items.kpi_key IS 'Associated KPI key for tracking impact';
COMMENT ON COLUMN gate_h.action_items.dim_key IS 'Dimension key (e.g., department, location)';
COMMENT ON COLUMN gate_h.action_items.dim_value IS 'Dimension value (e.g., HR, Riyadh)';
COMMENT ON COLUMN gate_h.action_items.sla_days IS 'SLA in days from creation; must be positive when set';
COMMENT ON COLUMN gate_h.action_items.verified_at IS 'Timestamp when action was verified/approved';
COMMENT ON COLUMN gate_h.action_items.closed_at IS 'Timestamp when action was closed';

-- Indexes for action_items
CREATE INDEX IF NOT EXISTS idx_action_items_tenant_status 
  ON gate_h.action_items (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_action_items_tenant_assignee_status 
  ON gate_h.action_items (tenant_id, assignee_user_id, status);

CREATE INDEX IF NOT EXISTS idx_action_items_tenant_due_status 
  ON gate_h.action_items (tenant_id, due_date, status);

CREATE INDEX IF NOT EXISTS idx_action_items_tenant_kpi 
  ON gate_h.action_items (tenant_id, kpi_key);

-- ============================================================
-- 4) Create table gate_h.action_updates
-- ============================================================

CREATE TABLE IF NOT EXISTS gate_h.action_updates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  action_id     UUID NOT NULL,
  
  -- Update type and content
  update_type   gate_h_action_update_type_enum NOT NULL,
  body_ar       TEXT NULL,
  evidence_url  TEXT NULL,
  
  -- Status change tracking
  new_status    gate_h_action_status_enum NULL,
  
  -- Progress tracking
  progress_pct  INTEGER NULL CHECK (progress_pct IS NULL OR (progress_pct >= 0 AND progress_pct <= 100)),
  
  -- Audit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID NOT NULL DEFAULT app_current_user_id(),
  
  -- Foreign keys
  CONSTRAINT fk_action_updates_tenant FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_updates_action FOREIGN KEY (action_id) 
    REFERENCES gate_h.action_items(id) ON DELETE CASCADE
);

COMMENT ON TABLE gate_h.action_updates IS 'Audit trail for action items: comments, progress updates, evidence uploads, and status changes.';
COMMENT ON COLUMN gate_h.action_updates.update_type IS 'Type: comment, progress, evidence, or status_change';
COMMENT ON COLUMN gate_h.action_updates.evidence_url IS 'Link to uploaded evidence (file, document, screenshot)';
COMMENT ON COLUMN gate_h.action_updates.new_status IS 'New status when update_type = status_change';
COMMENT ON COLUMN gate_h.action_updates.progress_pct IS 'Progress percentage (0-100) when update_type = progress';

-- Indexes for action_updates
CREATE INDEX IF NOT EXISTS idx_action_updates_tenant_action_created 
  ON gate_h.action_updates (tenant_id, action_id, created_at);

CREATE INDEX IF NOT EXISTS idx_action_updates_tenant_type 
  ON gate_h.action_updates (tenant_id, update_type);

-- ============================================================
-- 5) Create table gate_h.action_links
-- ============================================================

CREATE TABLE IF NOT EXISTS gate_h.action_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL,
  action_id  UUID NOT NULL,
  
  -- Link details
  link_type  TEXT NOT NULL CHECK (link_type IN ('external_task', 'doc', 'drive', 'ticket')),
  url        TEXT NOT NULL,
  title      TEXT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT app_current_user_id(),
  
  -- Foreign keys
  CONSTRAINT fk_action_links_tenant FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_links_action FOREIGN KEY (action_id) 
    REFERENCES gate_h.action_items(id) ON DELETE CASCADE
);

COMMENT ON TABLE gate_h.action_links IS 'External links related to action items: tickets, documents, drive files, external task trackers.';
COMMENT ON COLUMN gate_h.action_links.link_type IS 'Type: external_task, doc, drive, or ticket';

-- Index for action_links
CREATE INDEX IF NOT EXISTS idx_action_links_tenant_action 
  ON gate_h.action_links (tenant_id, action_id);

-- ============================================================
-- 6) Create table gate_h.action_sla_rules
-- ============================================================

CREATE TABLE IF NOT EXISTS gate_h.action_sla_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  kpi_key           TEXT NULL,
  priority          gate_h_action_priority_enum NOT NULL,
  default_sla_days  INTEGER NOT NULL CHECK (default_sla_days > 0),
  
  -- Audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID NOT NULL DEFAULT app_current_user_id(),
  
  -- Foreign keys
  CONSTRAINT fk_action_sla_rules_tenant FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE
);

COMMENT ON TABLE gate_h.action_sla_rules IS 'Default SLA rules by priority and optionally by KPI. Used to auto-populate sla_days when creating actions.';
COMMENT ON COLUMN gate_h.action_sla_rules.kpi_key IS 'Optional KPI-specific SLA; if NULL, rule applies globally per tenant/priority';

-- Unique index to prevent duplicate rules
CREATE UNIQUE INDEX IF NOT EXISTS idx_action_sla_rules_unique 
  ON gate_h.action_sla_rules (tenant_id, COALESCE(kpi_key, ''), priority);

-- ============================================================
-- 7) Triggers to sync tenant_id on child tables
-- ============================================================

-- Trigger function to auto-set tenant_id from parent action
CREATE OR REPLACE FUNCTION gate_h.set_action_child_tenant()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_tenant_id UUID;
BEGIN
  -- Look up parent action's tenant_id
  SELECT tenant_id INTO v_parent_tenant_id
  FROM gate_h.action_items
  WHERE id = NEW.action_id;
  
  IF v_parent_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Parent action_id % not found', NEW.action_id;
  END IF;
  
  -- Set child's tenant_id to match parent
  NEW.tenant_id := v_parent_tenant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION gate_h.set_action_child_tenant() IS 'Auto-sets tenant_id on child tables (updates, links) to match parent action item';

-- Attach trigger to action_updates
DROP TRIGGER IF EXISTS action_updates_set_tenant ON gate_h.action_updates;
CREATE TRIGGER action_updates_set_tenant
  BEFORE INSERT OR UPDATE ON gate_h.action_updates
  FOR EACH ROW
  EXECUTE FUNCTION gate_h.set_action_child_tenant();

-- Attach trigger to action_links
DROP TRIGGER IF EXISTS action_links_set_tenant ON gate_h.action_links;
CREATE TRIGGER action_links_set_tenant
  BEFORE INSERT OR UPDATE ON gate_h.action_links
  FOR EACH ROW
  EXECUTE FUNCTION gate_h.set_action_child_tenant();

-- ============================================================
-- 8) Trigger to auto-update updated_at and updated_by on action_items
-- ============================================================

CREATE OR REPLACE FUNCTION gate_h.update_action_items_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := app_current_user_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION gate_h.update_action_items_metadata() IS 'Auto-updates updated_at and updated_by on action_items modifications';

DROP TRIGGER IF EXISTS action_items_update_metadata ON gate_h.action_items;
CREATE TRIGGER action_items_update_metadata
  BEFORE UPDATE ON gate_h.action_items
  FOR EACH ROW
  EXECUTE FUNCTION gate_h.update_action_items_metadata();

-- ============================================================
-- End of Part 2.1: Gate-H Schema Migration
-- ============================================================