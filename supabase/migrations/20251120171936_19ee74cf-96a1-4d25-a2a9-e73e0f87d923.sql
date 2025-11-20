
-- =====================================================
-- M18: Incident Response System - Database Schema
-- Part 1: Core Tables, RLS, Triggers, Functions
-- =====================================================

-- ========================================
-- 1. SECURITY INCIDENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  
  -- Incident Identification
  incident_number TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  
  -- Classification
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'data_breach', 'malware', 'phishing', 'unauthorized_access',
    'dos_attack', 'ddos_attack', 'policy_violation', 'system_failure',
    'social_engineering', 'insider_threat', 'ransomware', 'other'
  )),
  
  -- Status & Workflow
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'contained', 'eradicating', 
    'recovering', 'resolved', 'closed'
  )),
  
  -- Timeline
  detected_at TIMESTAMPTZ NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Assignment & Ownership
  reported_by UUID NOT NULL,
  assigned_to UUID,
  assigned_team TEXT,
  acknowledged_by UUID,
  resolved_by UUID,
  closed_by UUID,
  
  -- Response Plan
  response_plan_id UUID,
  
  -- Impact Assessment
  affected_assets TEXT[],
  affected_users TEXT[],
  affected_systems TEXT[],
  impact_level TEXT CHECK (impact_level IN ('minimal', 'moderate', 'significant', 'severe')),
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  
  -- Root Cause & Resolution
  root_cause_ar TEXT,
  root_cause_en TEXT,
  containment_actions JSONB DEFAULT '[]'::jsonb,
  eradication_actions JSONB DEFAULT '[]'::jsonb,
  recovery_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Lessons Learned
  lessons_learned_ar TEXT,
  lessons_learned_en TEXT,
  recommendations_ar TEXT,
  recommendations_en TEXT,
  
  -- Metadata & Audit
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  is_false_positive BOOLEAN DEFAULT false,
  
  -- Backup Metadata (M23 Standard)
  last_backed_up_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_incident_number_per_tenant UNIQUE (tenant_id, incident_number)
);

-- Indexes for security_incidents
CREATE INDEX idx_incidents_tenant_status ON security_incidents(tenant_id, status);
CREATE INDEX idx_incidents_severity ON security_incidents(severity, status);
CREATE INDEX idx_incidents_type ON security_incidents(incident_type, severity);
CREATE INDEX idx_incidents_detected_at ON security_incidents(detected_at DESC);
CREATE INDEX idx_incidents_assigned_to ON security_incidents(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_incidents_response_plan ON security_incidents(response_plan_id) WHERE response_plan_id IS NOT NULL;
CREATE INDEX idx_incidents_backup ON security_incidents(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX idx_incidents_tags ON security_incidents USING GIN(tags);

-- Comments
COMMENT ON TABLE security_incidents IS 'M18: Security incidents tracking and management';
COMMENT ON COLUMN security_incidents.incident_number IS 'Auto-generated: INC-YYYY-NNNN';
COMMENT ON COLUMN security_incidents.last_backed_up_at IS 'M23 Standard: Last backup timestamp';

-- ========================================
-- 2. INCIDENT TIMELINE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS incident_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
  
  -- Event Details
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'detected', 'reported', 'acknowledged', 'assigned', 'status_changed',
    'investigated', 'contained', 'eradicated', 'escalated', 
    'resolved', 'closed', 'reopened', 'note_added', 'evidence_added',
    'action_taken', 'notification_sent'
  )),
  
  -- Action Description
  action_ar TEXT NOT NULL,
  action_en TEXT,
  
  -- Actor Information
  actor_id UUID,
  actor_role TEXT,
  
  -- Additional Details
  details JSONB DEFAULT '{}'::jsonb,
  previous_value TEXT,
  new_value TEXT,
  
  -- Evidence & Attachments
  evidence_urls TEXT[],
  attachment_ids UUID[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for incident_timeline
CREATE INDEX idx_incident_timeline_incident ON incident_timeline(incident_id, timestamp DESC);
CREATE INDEX idx_incident_timeline_event_type ON incident_timeline(event_type, timestamp DESC);
CREATE INDEX idx_incident_timeline_actor ON incident_timeline(actor_id) WHERE actor_id IS NOT NULL;

-- Comments
COMMENT ON TABLE incident_timeline IS 'M18: Detailed timeline of all incident events';
COMMENT ON COLUMN incident_timeline.event_type IS 'Type of event in incident lifecycle';

-- ========================================
-- 3. INCIDENT RESPONSE PLANS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS incident_response_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  
  -- Plan Identification
  plan_name_ar TEXT NOT NULL,
  plan_name_en TEXT,
  plan_code TEXT,
  description_ar TEXT,
  description_en TEXT,
  
  -- Applicability
  incident_type TEXT NOT NULL,
  severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical', 'all')),
  
  -- Response Steps
  response_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Escalation Rules
  escalation_rules JSONB DEFAULT '{}'::jsonb,
  
  -- Notification Rules
  notification_rules JSONB DEFAULT '{}'::jsonb,
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  version INTEGER DEFAULT 1,
  
  -- Approval & Review
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  next_review_date DATE,
  
  -- Backup Metadata (M23 Standard)
  last_backed_up_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_plan_code_per_tenant UNIQUE (tenant_id, plan_code)
);

-- Indexes for incident_response_plans
CREATE INDEX idx_response_plans_tenant ON incident_response_plans(tenant_id);
CREATE INDEX idx_response_plans_type_severity ON incident_response_plans(incident_type, severity_level);
CREATE INDEX idx_response_plans_active ON incident_response_plans(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_response_plans_backup ON incident_response_plans(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- Comments
COMMENT ON TABLE incident_response_plans IS 'M18: Pre-defined incident response playbooks';
COMMENT ON COLUMN incident_response_plans.response_steps IS 'Ordered list of response steps';
COMMENT ON COLUMN incident_response_plans.last_backed_up_at IS 'M23 Standard: Last backup timestamp';

-- ========================================
-- 4. INCIDENT METRICS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS incident_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
  
  -- Time Metrics
  time_to_detect_minutes INTEGER,
  time_to_acknowledge_minutes INTEGER,
  time_to_contain_minutes INTEGER,
  time_to_resolve_minutes INTEGER,
  total_response_time_minutes INTEGER,
  
  -- Compliance Metrics
  met_sla BOOLEAN,
  sla_target_minutes INTEGER,
  sla_variance_minutes INTEGER,
  
  -- Cost Metrics
  response_cost NUMERIC(12,2),
  impact_cost NUMERIC(12,2),
  
  -- Quality Metrics
  response_plan_followed BOOLEAN DEFAULT true,
  steps_completed INTEGER,
  steps_total INTEGER,
  
  -- Calculated At
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_metrics_per_incident UNIQUE (incident_id)
);

-- Index
CREATE INDEX idx_incident_metrics_tenant ON incident_metrics(tenant_id);
CREATE INDEX idx_incident_metrics_sla ON incident_metrics(met_sla, calculated_at DESC);

COMMENT ON TABLE incident_metrics IS 'M18: Performance metrics for incident response';

-- ========================================
-- 5. RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_response_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_metrics ENABLE ROW LEVEL SECURITY;

-- security_incidents policies
CREATE POLICY "security_incidents_tenant_isolation_select"
ON security_incidents FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "security_incidents_tenant_isolation_insert"
ON security_incidents FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "security_incidents_tenant_isolation_update"
ON security_incidents FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "security_incidents_tenant_isolation_delete"
ON security_incidents FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- incident_timeline policies
CREATE POLICY "incident_timeline_tenant_isolation_select"
ON incident_timeline FOR SELECT
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM security_incidents 
    WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "incident_timeline_tenant_isolation_insert"
ON incident_timeline FOR INSERT
TO authenticated
WITH CHECK (
  incident_id IN (
    SELECT id FROM security_incidents 
    WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "incident_timeline_tenant_isolation_update"
ON incident_timeline FOR UPDATE
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM security_incidents 
    WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "incident_timeline_tenant_isolation_delete"
ON incident_timeline FOR DELETE
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM security_incidents 
    WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- incident_response_plans policies
CREATE POLICY "incident_response_plans_tenant_isolation_select"
ON incident_response_plans FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "incident_response_plans_tenant_isolation_insert"
ON incident_response_plans FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "incident_response_plans_tenant_isolation_update"
ON incident_response_plans FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "incident_response_plans_tenant_isolation_delete"
ON incident_response_plans FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- incident_metrics policies
CREATE POLICY "incident_metrics_tenant_isolation_select"
ON incident_metrics FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "incident_metrics_tenant_isolation_insert"
ON incident_metrics FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- ========================================
-- 6. TRANSACTION LOGGING TRIGGERS
-- ========================================

CREATE TRIGGER security_incidents_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER incident_response_plans_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON incident_response_plans
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ========================================
-- 7. AUTO-UPDATE TRIGGERS
-- ========================================

CREATE TRIGGER security_incidents_updated_at
  BEFORE UPDATE ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER incident_response_plans_updated_at
  BEFORE UPDATE ON incident_response_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 8. HELPER FUNCTIONS
-- ========================================

-- Function: Generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COUNT(*) INTO v_count
  FROM security_incidents
  WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM created_at) = v_year;
  
  v_number := 'INC-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

COMMENT ON FUNCTION generate_incident_number IS 'M18: Auto-generate incident numbers (INC-YYYY-NNNN)';

-- Function: Calculate incident metrics
CREATE OR REPLACE FUNCTION calculate_incident_metrics(p_incident_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incident security_incidents%ROWTYPE;
  v_time_to_detect INTEGER;
  v_time_to_acknowledge INTEGER;
  v_time_to_contain INTEGER;
  v_time_to_resolve INTEGER;
  v_total_time INTEGER;
BEGIN
  SELECT * INTO v_incident FROM security_incidents WHERE id = p_incident_id;
  
  IF NOT FOUND THEN RETURN; END IF;
  
  v_time_to_detect := EXTRACT(EPOCH FROM (v_incident.detected_at - v_incident.detected_at)) / 60;
  
  v_time_to_acknowledge := CASE 
    WHEN v_incident.acknowledged_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (v_incident.acknowledged_at - v_incident.detected_at)) / 60
    ELSE NULL
  END;
  
  v_time_to_contain := CASE 
    WHEN v_incident.contained_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (v_incident.contained_at - v_incident.detected_at)) / 60
    ELSE NULL
  END;
  
  v_time_to_resolve := CASE 
    WHEN v_incident.resolved_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (v_incident.resolved_at - v_incident.detected_at)) / 60
    ELSE NULL
  END;
  
  v_total_time := COALESCE(v_time_to_resolve, 
    EXTRACT(EPOCH FROM (now() - v_incident.detected_at)) / 60
  );
  
  INSERT INTO incident_metrics (
    tenant_id, incident_id, time_to_detect_minutes,
    time_to_acknowledge_minutes, time_to_contain_minutes,
    time_to_resolve_minutes, total_response_time_minutes
  ) VALUES (
    v_incident.tenant_id, p_incident_id, v_time_to_detect,
    v_time_to_acknowledge, v_time_to_contain,
    v_time_to_resolve, v_total_time
  )
  ON CONFLICT (incident_id) 
  DO UPDATE SET
    time_to_acknowledge_minutes = EXCLUDED.time_to_acknowledge_minutes,
    time_to_contain_minutes = EXCLUDED.time_to_contain_minutes,
    time_to_resolve_minutes = EXCLUDED.time_to_resolve_minutes,
    total_response_time_minutes = EXCLUDED.total_response_time_minutes,
    calculated_at = now();
END;
$$;

COMMENT ON FUNCTION calculate_incident_metrics IS 'M18: Calculate performance metrics for incidents';
