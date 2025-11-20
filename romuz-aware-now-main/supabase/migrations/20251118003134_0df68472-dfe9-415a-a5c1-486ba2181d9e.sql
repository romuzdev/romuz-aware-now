-- ============================================================================
-- M11: Action Plans Enhancement - Database Layer
-- Milestones, Dependencies, Tracking, and Notifications
-- ============================================================================

-- ============================================================
-- 1) Action Plan Milestones Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.action_plan_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES gate_h.action_items(id) ON DELETE CASCADE,
  
  -- Milestone details
  title_ar TEXT NOT NULL,
  description_ar TEXT,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('start', 'checkpoint', 'deliverable', 'review', 'completion')),
  
  -- Schedule
  planned_date DATE NOT NULL,
  actual_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
  completion_pct INTEGER DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  
  -- Deliverables
  deliverables JSONB DEFAULT '[]'::jsonb,
  evidence_urls TEXT[],
  
  -- Sequence
  sequence_order INTEGER NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL
);

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_action_milestone_seq' 
    AND conrelid = 'public.action_plan_milestones'::regclass
  ) THEN
    ALTER TABLE public.action_plan_milestones 
    ADD CONSTRAINT uq_action_milestone_seq UNIQUE (action_id, sequence_order);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_action_id ON public.action_plan_milestones(action_id);
CREATE INDEX IF NOT EXISTS idx_milestones_tenant_id ON public.action_plan_milestones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.action_plan_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_planned_date ON public.action_plan_milestones(planned_date);

-- RLS Policies
ALTER TABLE public.action_plan_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestones_tenant_isolation" ON public.action_plan_milestones;
CREATE POLICY "milestones_tenant_isolation" ON public.action_plan_milestones
  FOR ALL USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "milestones_select" ON public.action_plan_milestones;
CREATE POLICY "milestones_select" ON public.action_plan_milestones
  FOR SELECT USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "milestones_insert" ON public.action_plan_milestones;
CREATE POLICY "milestones_insert" ON public.action_plan_milestones
  FOR INSERT WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND created_by = app_current_user_id()
  );

DROP POLICY IF EXISTS "milestones_update" ON public.action_plan_milestones;
CREATE POLICY "milestones_update" ON public.action_plan_milestones
  FOR UPDATE USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "milestones_delete" ON public.action_plan_milestones;
CREATE POLICY "milestones_delete" ON public.action_plan_milestones
  FOR DELETE USING (tenant_id = app_current_tenant_id());

-- ============================================================
-- 2) Action Plan Dependencies Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.action_plan_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Dependency relationship
  source_action_id UUID NOT NULL REFERENCES gate_h.action_items(id) ON DELETE CASCADE,
  target_action_id UUID NOT NULL REFERENCES gate_h.action_items(id) ON DELETE CASCADE,
  
  -- Dependency type
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  
  -- Lag time (in days)
  lag_days INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  violation_status TEXT CHECK (violation_status IN ('ok', 'warning', 'violation')),
  
  -- Notes
  notes_ar TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_action_dep' 
    AND conrelid = 'public.action_plan_dependencies'::regclass
  ) THEN
    ALTER TABLE public.action_plan_dependencies 
    ADD CONSTRAINT uq_action_dep UNIQUE (source_action_id, target_action_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_no_self_dep' 
    AND conrelid = 'public.action_plan_dependencies'::regclass
  ) THEN
    ALTER TABLE public.action_plan_dependencies 
    ADD CONSTRAINT chk_no_self_dep CHECK (source_action_id != target_action_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deps_source ON public.action_plan_dependencies(source_action_id);
CREATE INDEX IF NOT EXISTS idx_deps_target ON public.action_plan_dependencies(target_action_id);
CREATE INDEX IF NOT EXISTS idx_deps_tenant ON public.action_plan_dependencies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deps_active ON public.action_plan_dependencies(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.action_plan_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deps_tenant_isolation" ON public.action_plan_dependencies;
CREATE POLICY "deps_tenant_isolation" ON public.action_plan_dependencies
  FOR ALL USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "deps_select" ON public.action_plan_dependencies;
CREATE POLICY "deps_select" ON public.action_plan_dependencies
  FOR SELECT USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "deps_insert" ON public.action_plan_dependencies;
CREATE POLICY "deps_insert" ON public.action_plan_dependencies
  FOR INSERT WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND created_by = app_current_user_id()
  );

DROP POLICY IF EXISTS "deps_update" ON public.action_plan_dependencies;
CREATE POLICY "deps_update" ON public.action_plan_dependencies
  FOR UPDATE USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "deps_delete" ON public.action_plan_dependencies;
CREATE POLICY "deps_delete" ON public.action_plan_dependencies
  FOR DELETE USING (tenant_id = app_current_tenant_id());

-- ============================================================
-- 3) Action Plan Tracking Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.action_plan_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES gate_h.action_items(id) ON DELETE CASCADE,
  
  -- Snapshot timestamp
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Progress metrics
  progress_pct INTEGER NOT NULL CHECK (progress_pct >= 0 AND progress_pct <= 100),
  milestones_completed INTEGER NOT NULL DEFAULT 0,
  milestones_total INTEGER NOT NULL DEFAULT 0,
  
  -- Time tracking
  days_elapsed INTEGER,
  days_remaining INTEGER,
  is_on_track BOOLEAN,
  is_at_risk BOOLEAN,
  is_overdue BOOLEAN,
  
  -- Performance indicators
  velocity_score NUMERIC(5,2),
  health_score NUMERIC(5,2) CHECK (health_score >= 0 AND health_score <= 100),
  
  -- Issues
  blockers_count INTEGER DEFAULT 0,
  issues_summary JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_track_action ON public.action_plan_tracking(action_id);
CREATE INDEX IF NOT EXISTS idx_track_tenant ON public.action_plan_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_track_snapshot ON public.action_plan_tracking(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_health ON public.action_plan_tracking(health_score);

-- RLS Policies
ALTER TABLE public.action_plan_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "track_tenant_isolation" ON public.action_plan_tracking;
CREATE POLICY "track_tenant_isolation" ON public.action_plan_tracking
  FOR ALL USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "track_select" ON public.action_plan_tracking;
CREATE POLICY "track_select" ON public.action_plan_tracking
  FOR SELECT USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "track_insert" ON public.action_plan_tracking;
CREATE POLICY "track_insert" ON public.action_plan_tracking
  FOR INSERT WITH CHECK (tenant_id = app_current_tenant_id());

-- ============================================================
-- 4) Action Plan Notifications Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.action_plan_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES gate_h.action_items(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'escalation', 'milestone_due', 'overdue', 'at_risk', 'completed')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Message
  title_ar TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  
  -- Recipients
  recipient_user_ids UUID[] NOT NULL,
  
  -- Trigger
  trigger_condition JSONB,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Delivery
  delivery_channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  sent_at TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  
  -- Response
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notif_action ON public.action_plan_notifications(action_id);
CREATE INDEX IF NOT EXISTS idx_notif_tenant ON public.action_plan_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notif_type ON public.action_plan_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_status ON public.action_plan_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notif_triggered ON public.action_plan_notifications(triggered_at DESC);

-- RLS Policies
ALTER TABLE public.action_plan_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_tenant_isolation" ON public.action_plan_notifications;
CREATE POLICY "notif_tenant_isolation" ON public.action_plan_notifications
  FOR ALL USING (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "notif_select" ON public.action_plan_notifications;
CREATE POLICY "notif_select" ON public.action_plan_notifications
  FOR SELECT USING (
    tenant_id = app_current_tenant_id() 
    AND (
      app_current_user_id() = ANY(recipient_user_ids)
      OR app_has_role('admin')
    )
  );

DROP POLICY IF EXISTS "notif_insert" ON public.action_plan_notifications;
CREATE POLICY "notif_insert" ON public.action_plan_notifications
  FOR INSERT WITH CHECK (tenant_id = app_current_tenant_id());

DROP POLICY IF EXISTS "notif_update" ON public.action_plan_notifications;
CREATE POLICY "notif_update" ON public.action_plan_notifications
  FOR UPDATE USING (
    tenant_id = app_current_tenant_id()
    AND app_current_user_id() = ANY(recipient_user_ids)
  );

-- ============================================================
-- 5) Database Functions
-- ============================================================

-- Function: Calculate action health score
CREATE OR REPLACE FUNCTION public.fn_calculate_action_health_score(p_action_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_health_score NUMERIC := 100.0;
  v_is_overdue BOOLEAN;
  v_blockers_count INTEGER;
  v_milestones_on_track INTEGER;
  v_milestones_total INTEGER;
BEGIN
  -- Get action progress
  SELECT 
    CASE WHEN due_date < CURRENT_DATE::TEXT THEN true ELSE false END
  INTO v_is_overdue
  FROM gate_h.action_items
  WHERE id = p_action_id;
  
  -- Get milestones status
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed' OR (status = 'in_progress' AND planned_date >= CURRENT_DATE))
  INTO v_milestones_total, v_milestones_on_track
  FROM public.action_plan_milestones
  WHERE action_id = p_action_id;
  
  -- Calculate penalties
  IF v_is_overdue THEN
    v_health_score := v_health_score - 30;
  END IF;
  
  IF v_milestones_total > 0 THEN
    v_health_score := v_health_score * (v_milestones_on_track::NUMERIC / v_milestones_total);
  END IF;
  
  -- Get blockers
  SELECT COUNT(*)
  INTO v_blockers_count
  FROM gate_h.action_items ai
  JOIN public.action_plan_dependencies dep ON dep.target_action_id = p_action_id
  WHERE ai.id = dep.source_action_id 
    AND ai.status::TEXT IN ('blocked', 'new');
  
  IF v_blockers_count > 0 THEN
    v_health_score := v_health_score - (v_blockers_count * 10);
  END IF;
  
  -- Ensure bounds
  v_health_score := GREATEST(0, LEAST(100, v_health_score));
  
  RETURN v_health_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Check dependency violations
CREATE OR REPLACE FUNCTION public.fn_check_dependency_violations()
RETURNS TRIGGER AS $$
DECLARE
  v_source_status TEXT;
  v_target_status TEXT;
BEGIN
  -- Get statuses
  SELECT status::TEXT INTO v_source_status 
  FROM gate_h.action_items 
  WHERE id = NEW.source_action_id;
  
  SELECT status::TEXT INTO v_target_status 
  FROM gate_h.action_items 
  WHERE id = NEW.target_action_id;
  
  -- Check finish-to-start violation
  IF NEW.dependency_type = 'finish_to_start' THEN
    IF v_target_status IN ('in_progress', 'closed') AND v_source_status NOT IN ('closed') THEN
      NEW.violation_status := 'violation';
    ELSE
      NEW.violation_status := 'ok';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Auto-update milestone updated_at
DROP TRIGGER IF EXISTS tr_milestones_updated ON public.action_plan_milestones;
CREATE TRIGGER tr_milestones_updated
BEFORE UPDATE ON public.action_plan_milestones
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by_column();

-- Trigger: Check dependency violations
DROP TRIGGER IF EXISTS tr_check_deps ON public.action_plan_dependencies;
CREATE TRIGGER tr_check_deps
BEFORE INSERT OR UPDATE ON public.action_plan_dependencies
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_dependency_violations();

-- ============================================================
-- 6) RPC Functions
-- ============================================================

-- Get milestones for an action
CREATE OR REPLACE FUNCTION public.fn_gate_h_get_milestones(p_action_id UUID)
RETURNS TABLE (
  id UUID,
  action_id UUID,
  title_ar TEXT,
  description_ar TEXT,
  milestone_type TEXT,
  planned_date DATE,
  actual_date DATE,
  status TEXT,
  completion_pct INTEGER,
  deliverables JSONB,
  evidence_urls TEXT[],
  sequence_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id, m.action_id, m.title_ar, m.description_ar, m.milestone_type,
    m.planned_date, m.actual_date, m.status, m.completion_pct,
    m.deliverables, m.evidence_urls, m.sequence_order,
    m.created_at, m.updated_at
  FROM public.action_plan_milestones m
  WHERE m.action_id = p_action_id
    AND m.tenant_id = app_current_tenant_id()
  ORDER BY m.sequence_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get dependencies for an action
CREATE OR REPLACE FUNCTION public.fn_gate_h_get_dependencies(p_action_id UUID)
RETURNS TABLE (
  id UUID,
  source_action_id UUID,
  target_action_id UUID,
  dependency_type TEXT,
  lag_days INTEGER,
  is_active BOOLEAN,
  violation_status TEXT,
  notes_ar TEXT,
  source_action_title TEXT,
  target_action_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, d.source_action_id, d.target_action_id, d.dependency_type,
    d.lag_days, d.is_active, d.violation_status, d.notes_ar,
    sa.title_ar as source_action_title,
    ta.title_ar as target_action_title
  FROM public.action_plan_dependencies d
  JOIN gate_h.action_items sa ON d.source_action_id = sa.id
  JOIN gate_h.action_items ta ON d.target_action_id = ta.id
  WHERE (d.source_action_id = p_action_id OR d.target_action_id = p_action_id)
    AND d.tenant_id = app_current_tenant_id()
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get tracking history for an action
CREATE OR REPLACE FUNCTION public.fn_gate_h_get_tracking(p_action_id UUID, p_limit INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  snapshot_at TIMESTAMPTZ,
  progress_pct INTEGER,
  milestones_completed INTEGER,
  milestones_total INTEGER,
  days_elapsed INTEGER,
  days_remaining INTEGER,
  is_on_track BOOLEAN,
  is_at_risk BOOLEAN,
  is_overdue BOOLEAN,
  velocity_score NUMERIC,
  health_score NUMERIC,
  blockers_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.snapshot_at, t.progress_pct,
    t.milestones_completed, t.milestones_total,
    t.days_elapsed, t.days_remaining,
    t.is_on_track, t.is_at_risk, t.is_overdue,
    t.velocity_score, t.health_score, t.blockers_count
  FROM public.action_plan_tracking t
  WHERE t.action_id = p_action_id
    AND t.tenant_id = app_current_tenant_id()
  ORDER BY t.snapshot_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;