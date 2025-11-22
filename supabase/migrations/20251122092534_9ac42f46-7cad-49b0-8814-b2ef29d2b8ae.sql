-- ============================================================================
-- M25 - Tenant Success Toolkit v1.0
-- Database Schema: Setup Wizard, Health Scores, Playbooks, Actions, Nudges
-- ============================================================================

-- ============================================================================
-- 1. Setup Wizard States
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.success_wizard_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  wizard_type TEXT NOT NULL DEFAULT 'initial_setup',
  current_step TEXT NOT NULL,
  completed_steps TEXT[] DEFAULT '{}',
  total_steps INTEGER NOT NULL,
  completion_pct INTEGER DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  wizard_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_wizard_per_tenant UNIQUE(tenant_id, wizard_type)
);

CREATE INDEX idx_wizard_states_tenant ON public.success_wizard_states(tenant_id);
CREATE INDEX idx_wizard_states_completed ON public.success_wizard_states(tenant_id, is_completed);

COMMENT ON TABLE public.success_wizard_states IS 'M25: Tracks tenant onboarding wizard progress';

-- ============================================================================
-- 2. Health Snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.success_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  org_unit_id UUID,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  adoption_score INTEGER CHECK (adoption_score >= 0 AND adoption_score <= 100),
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  risk_hygiene_score INTEGER CHECK (risk_hygiene_score >= 0 AND risk_hygiene_score <= 100),
  
  health_status TEXT DEFAULT 'needs_attention',
  metrics JSONB DEFAULT '{}',
  recommendations_count INTEGER DEFAULT 0,
  critical_issues_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_health_snapshot UNIQUE(tenant_id, org_unit_id, snapshot_date)
);

CREATE INDEX idx_health_snapshots_tenant ON public.success_health_snapshots(tenant_id, snapshot_date DESC);
CREATE INDEX idx_health_snapshots_org_unit ON public.success_health_snapshots(org_unit_id, snapshot_date DESC);
CREATE INDEX idx_health_snapshots_status ON public.success_health_snapshots(tenant_id, health_status);

COMMENT ON TABLE public.success_health_snapshots IS 'M25: Daily health score snapshots for tenants and org units';

-- ============================================================================
-- 3. Playbooks
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.success_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  playbook_key TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  
  status TEXT DEFAULT 'active',
  
  total_actions INTEGER DEFAULT 0,
  completed_actions INTEGER DEFAULT 0,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  
  triggered_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  
  expected_impact JSONB DEFAULT '{}',
  actual_impact JSONB DEFAULT '{}',
  
  priority TEXT DEFAULT 'medium',
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playbooks_tenant ON public.success_playbooks(tenant_id, status);
CREATE INDEX idx_playbooks_key ON public.success_playbooks(tenant_id, playbook_key);
CREATE INDEX idx_playbooks_priority ON public.success_playbooks(tenant_id, priority, status);

COMMENT ON TABLE public.success_playbooks IS 'M25: Automated improvement playbooks';

-- ============================================================================
-- 4. Playbook Actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.success_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES public.success_playbooks(id) ON DELETE CASCADE,
  
  sequence_order INTEGER NOT NULL,
  
  action_type TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  
  action_config JSONB DEFAULT '{}',
  
  status TEXT DEFAULT 'pending',
  
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  
  evidence_urls TEXT[],
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_actions_playbook ON public.success_actions(playbook_id, sequence_order);
CREATE INDEX idx_actions_tenant ON public.success_actions(tenant_id, status);
CREATE INDEX idx_actions_assigned ON public.success_actions(assigned_to, status);

COMMENT ON TABLE public.success_actions IS 'M25: Individual actions within playbooks';

-- ============================================================================
-- 5. Nudges
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.success_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  nudge_type TEXT NOT NULL,
  
  title_ar TEXT NOT NULL,
  title_en TEXT,
  message_ar TEXT NOT NULL,
  message_en TEXT,
  
  target_user_id UUID,
  target_role TEXT,
  
  priority TEXT DEFAULT 'normal',
  
  delivery_channels TEXT[] DEFAULT ARRAY['in_app'],
  delivered_at TIMESTAMPTZ,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  context_type TEXT,
  context_id UUID,
  context_data JSONB DEFAULT '{}',
  
  action_url TEXT,
  action_label_ar TEXT,
  action_label_en TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_nudges_tenant ON public.success_nudges(tenant_id, created_at DESC);
CREATE INDEX idx_nudges_user ON public.success_nudges(target_user_id, is_read, created_at DESC);
CREATE INDEX idx_nudges_priority ON public.success_nudges(tenant_id, priority, is_read);
CREATE INDEX idx_nudges_delivery ON public.success_nudges(tenant_id, delivered_at);

COMMENT ON TABLE public.success_nudges IS 'M25: Coaching nudges and reminders';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.success_wizard_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_nudges ENABLE ROW LEVEL SECURITY;

-- Wizard States
CREATE POLICY "Users can view their tenant wizard"
  ON public.success_wizard_states FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Admins can manage wizard"
  ON public.success_wizard_states FOR ALL
  USING (tenant_id = app_current_tenant_id());

-- Health Snapshots
CREATE POLICY "Users can view health snapshots"
  ON public.success_health_snapshots FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "System can manage health snapshots"
  ON public.success_health_snapshots FOR ALL
  USING (tenant_id = app_current_tenant_id());

-- Playbooks
CREATE POLICY "Users can view playbooks"
  ON public.success_playbooks FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Admins can manage playbooks"
  ON public.success_playbooks FOR ALL
  USING (tenant_id = app_current_tenant_id());

-- Actions
CREATE POLICY "Users can view actions"
  ON public.success_actions FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Users can update assigned actions"
  ON public.success_actions FOR UPDATE
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Admins can manage actions"
  ON public.success_actions FOR ALL
  USING (tenant_id = app_current_tenant_id());

-- Nudges
CREATE POLICY "Users can view their nudges"
  ON public.success_nudges FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Users can update their nudges"
  ON public.success_nudges FOR UPDATE
  USING (tenant_id = app_current_tenant_id() AND target_user_id = auth.uid());

CREATE POLICY "System can manage nudges"
  ON public.success_nudges FOR ALL
  USING (tenant_id = app_current_tenant_id());

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_success_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wizard_states_updated_at
  BEFORE UPDATE ON public.success_wizard_states
  FOR EACH ROW EXECUTE FUNCTION update_success_updated_at();

CREATE TRIGGER update_playbooks_updated_at
  BEFORE UPDATE ON public.success_playbooks
  FOR EACH ROW EXECUTE FUNCTION update_success_updated_at();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON public.success_actions
  FOR EACH ROW EXECUTE FUNCTION update_success_updated_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_overall_health_score(
  p_adoption INTEGER,
  p_data_quality INTEGER,
  p_compliance INTEGER,
  p_risk_hygiene INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND(
    (COALESCE(p_adoption, 0) * 0.30 +
     COALESCE(p_data_quality, 0) * 0.20 +
     COALESCE(p_compliance, 0) * 0.25 +
     COALESCE(p_risk_hygiene, 0) * 0.25)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION determine_health_status(p_score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_score >= 85 THEN RETURN 'excellent';
  ELSIF p_score >= 70 THEN RETURN 'good';
  ELSIF p_score >= 50 THEN RETURN 'needs_attention';
  ELSE RETURN 'critical';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;