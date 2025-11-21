-- ============================================================================
-- Week 11-14: M18 & M19 Enhancements
-- Add missing features to existing tables + new enhancement tables
-- ============================================================================

-- ============================================================================
-- PART 1: M18 - Enhance Existing security_incidents Table
-- ============================================================================

-- Add SLA tracking columns
ALTER TABLE security_incidents 
ADD COLUMN IF NOT EXISTS sla_response_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_resolution_deadline TIMESTAMPTZ;

-- Add linking columns
ALTER TABLE security_incidents 
ADD COLUMN IF NOT EXISTS linked_events UUID[],
ADD COLUMN IF NOT EXISTS linked_risks UUID[],
ADD COLUMN IF NOT EXISTS linked_policies UUID[];

-- ============================================================================
-- PART 2: M18 - New Enhancement Tables
-- ============================================================================

-- Incident Response Teams
CREATE TABLE IF NOT EXISTS incident_response_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  team_lead_id UUID,
  members UUID[] DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  availability_schedule JSONB,
  contact_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Incident Timeline Events  
CREATE TABLE IF NOT EXISTS incident_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'status_changed', 'assigned', 'escalated', 
    'note_added', 'evidence_added', 'playbook_executed', 
    'cost_updated', 'linked_entity', 'resolved', 'closed'
  )),
  event_title_ar TEXT NOT NULL,
  event_title_en TEXT NOT NULL,
  event_description_ar TEXT,
  event_description_en TEXT,
  actor_id UUID NOT NULL,
  event_data JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Incident SLA Configuration
CREATE TABLE IF NOT EXISTS incident_sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  response_time_minutes INT NOT NULL,
  resolution_time_hours INT NOT NULL,
  escalation_time_minutes INT,
  business_hours_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, incident_type, severity)
);

-- ============================================================================
-- PART 3: M19 - New Predictive Analytics Tables
-- ============================================================================

-- Prediction Results
CREATE TABLE IF NOT EXISTS prediction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES prediction_models(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN (
    'risk', 'incident', 'compliance', 'campaign', 'user', 'resource'
  )),
  context_id UUID,
  predicted_value JSONB NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL,
  prediction_date TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  actual_value JSONB,
  actual_recorded_at TIMESTAMPTZ,
  accuracy_delta NUMERIC(5,4),
  feedback_provided BOOLEAN DEFAULT false,
  feedback_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Model Training History
CREATE TABLE IF NOT EXISTS model_training_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES prediction_models(id) ON DELETE CASCADE,
  training_date TIMESTAMPTZ DEFAULT now(),
  dataset_size INT NOT NULL,
  training_duration_seconds INT,
  accuracy_metrics JSONB NOT NULL,
  model_parameters JSONB NOT NULL,
  validation_results JSONB,
  notes TEXT,
  trained_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Prediction Alerts
CREATE TABLE IF NOT EXISTS prediction_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  prediction_id UUID NOT NULL REFERENCES prediction_results(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'high_risk_predicted', 'incident_imminent', 'compliance_drift',
    'resource_shortage', 'campaign_failure', 'anomaly_detected'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  recommended_actions JSONB,
  notified_users UUID[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  last_backed_up_at TIMESTAMPTZ
);

-- ============================================================================
-- PART 4: Add Backup Metadata to Existing Tables
-- ============================================================================

ALTER TABLE soar_playbooks 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

ALTER TABLE soar_executions 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

ALTER TABLE threat_indicators 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

-- ============================================================================
-- PART 5: Create Indexes for Performance
-- ============================================================================

-- Security Incidents - SLA tracking
CREATE INDEX IF NOT EXISTS idx_incidents_sla_response 
ON security_incidents(sla_response_deadline) 
WHERE status NOT IN ('resolved', 'closed');

CREATE INDEX IF NOT EXISTS idx_incidents_sla_resolution 
ON security_incidents(sla_resolution_deadline) 
WHERE status NOT IN ('resolved', 'closed');

-- Incident Response Teams
CREATE INDEX IF NOT EXISTS idx_incident_teams_tenant 
ON incident_response_teams(tenant_id);

CREATE INDEX IF NOT EXISTS idx_incident_teams_active 
ON incident_response_teams(tenant_id, is_active);

-- Incident Timeline
CREATE INDEX IF NOT EXISTS idx_timeline_incident 
ON incident_timeline_events(incident_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_tenant 
ON incident_timeline_events(tenant_id);

-- SLA Config
CREATE INDEX IF NOT EXISTS idx_sla_config_tenant_type 
ON incident_sla_config(tenant_id, incident_type, severity);

-- Prediction Results
CREATE INDEX IF NOT EXISTS idx_prediction_results_model 
ON prediction_results(model_id, prediction_date DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_results_context 
ON prediction_results(context_type, context_id);

CREATE INDEX IF NOT EXISTS idx_prediction_results_tenant_date 
ON prediction_results(tenant_id, prediction_date DESC);

-- Model Training History
CREATE INDEX IF NOT EXISTS idx_training_history_model 
ON model_training_history(model_id, training_date DESC);

-- Prediction Alerts
CREATE INDEX IF NOT EXISTS idx_prediction_alerts_tenant_status 
ON prediction_alerts(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_prediction_alerts_severity 
ON prediction_alerts(severity, status);

-- Backup metadata indexes
CREATE INDEX IF NOT EXISTS idx_incidents_backup 
ON security_incidents(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_playbooks_backup 
ON soar_playbooks(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_predictions_backup 
ON prediction_results(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

-- ============================================================================
-- PART 6: RLS Policies
-- ============================================================================

-- Incident Response Teams
ALTER TABLE incident_response_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incident_teams_tenant_isolation"
ON incident_response_teams FOR ALL
TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- Incident Timeline Events
ALTER TABLE incident_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_tenant_isolation"
ON incident_timeline_events FOR ALL
TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- Incident SLA Config
ALTER TABLE incident_sla_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sla_config_tenant_isolation"
ON incident_sla_config FOR ALL
TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- Prediction Results
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prediction_results_tenant_isolation"
ON prediction_results FOR ALL
TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- Model Training History
ALTER TABLE model_training_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_history_tenant_isolation"
ON model_training_history FOR ALL
TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- Prediction Alerts
ALTER TABLE prediction_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prediction_alerts_tenant_isolation"
ON prediction_alerts FOR ALL
TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- ============================================================================
-- PART 7: Helper Functions for M18
-- ============================================================================

-- Calculate SLA deadlines
CREATE OR REPLACE FUNCTION calculate_incident_sla(
  p_tenant_id UUID,
  p_incident_type TEXT,
  p_severity TEXT,
  p_created_at TIMESTAMPTZ
)
RETURNS TABLE(
  response_deadline TIMESTAMPTZ,
  resolution_deadline TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT response_time_minutes, resolution_time_hours
  INTO v_config
  FROM incident_sla_config
  WHERE tenant_id = p_tenant_id
    AND incident_type = p_incident_type
    AND severity = p_severity
    AND is_active = true
  LIMIT 1;
  
  IF v_config IS NULL THEN
    -- Default SLA if not configured
    RETURN QUERY SELECT 
      p_created_at + INTERVAL '60 minutes',
      p_created_at + INTERVAL '24 hours';
  ELSE
    RETURN QUERY SELECT
      p_created_at + (v_config.response_time_minutes || ' minutes')::INTERVAL,
      p_created_at + (v_config.resolution_time_hours || ' hours')::INTERVAL;
  END IF;
END;
$$;

-- Check SLA breach
CREATE OR REPLACE FUNCTION check_sla_breach(
  p_incident_id UUID
)
RETURNS TABLE(
  response_breached BOOLEAN,
  resolution_breached BOOLEAN,
  response_minutes_overdue INT,
  resolution_hours_overdue INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_incident RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT 
    sla_response_deadline,
    sla_resolution_deadline,
    acknowledged_at,
    resolved_at,
    status
  INTO v_incident
  FROM security_incidents
  WHERE id = p_incident_id;
  
  RETURN QUERY SELECT
    (v_incident.acknowledged_at IS NULL AND v_now > v_incident.sla_response_deadline)::BOOLEAN,
    (v_incident.status NOT IN ('resolved', 'closed') AND v_now > v_incident.sla_resolution_deadline)::BOOLEAN,
    CASE 
      WHEN v_incident.acknowledged_at IS NULL AND v_now > v_incident.sla_response_deadline 
      THEN EXTRACT(EPOCH FROM (v_now - v_incident.sla_response_deadline)) / 60
      ELSE 0
    END::INT,
    CASE 
      WHEN v_incident.status NOT IN ('resolved', 'closed') AND v_now > v_incident.sla_resolution_deadline
      THEN EXTRACT(EPOCH FROM (v_now - v_incident.sla_resolution_deadline)) / 3600
      ELSE 0
    END::INT;
END;
$$;

-- Auto-set SLA deadlines on incident creation
CREATE OR REPLACE FUNCTION set_incident_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
  v_deadlines RECORD;
BEGIN
  IF NEW.incident_type IS NOT NULL AND NEW.severity IS NOT NULL THEN
    SELECT * INTO v_deadlines
    FROM calculate_incident_sla(
      NEW.tenant_id,
      NEW.incident_type,
      NEW.severity,
      NEW.created_at
    );
    
    NEW.sla_response_deadline := v_deadlines.response_deadline;
    NEW.sla_resolution_deadline := v_deadlines.resolution_deadline;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_incident_sla_trigger ON security_incidents;
CREATE TRIGGER set_incident_sla_trigger
  BEFORE INSERT ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION set_incident_sla_deadlines();

-- ============================================================================
-- PART 8: Transaction Logging Triggers (Security Enhancement)
-- ============================================================================

-- Incidents
DROP TRIGGER IF EXISTS security_incidents_audit_trigger ON security_incidents;
CREATE TRIGGER security_incidents_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Playbooks
DROP TRIGGER IF EXISTS soar_playbooks_audit_trigger ON soar_playbooks;
CREATE TRIGGER soar_playbooks_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON soar_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Prediction Models
DROP TRIGGER IF EXISTS prediction_models_audit_trigger ON prediction_models;
CREATE TRIGGER prediction_models_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prediction_models
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Prediction Results
DROP TRIGGER IF EXISTS prediction_results_audit_trigger ON prediction_results;
CREATE TRIGGER prediction_results_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prediction_results
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Incident Teams
DROP TRIGGER IF EXISTS incident_teams_audit_trigger ON incident_response_teams;
CREATE TRIGGER incident_teams_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON incident_response_teams
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ============================================================================
-- PART 9: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE incident_response_teams IS 'M18: Teams responsible for incident response';
COMMENT ON TABLE incident_timeline_events IS 'M18: Timeline tracking for incident lifecycle';
COMMENT ON TABLE incident_sla_config IS 'M18: SLA configuration per incident type and severity';
COMMENT ON TABLE prediction_results IS 'M19: Results from prediction model executions';
COMMENT ON TABLE model_training_history IS 'M19: Historical record of model training sessions';
COMMENT ON TABLE prediction_alerts IS 'M19: Alerts generated from predictions';

COMMENT ON COLUMN security_incidents.sla_response_deadline IS 'M18: Deadline for initial response';
COMMENT ON COLUMN security_incidents.sla_resolution_deadline IS 'M18: Deadline for incident resolution';
COMMENT ON COLUMN security_incidents.linked_events IS 'M18: Related security events';
COMMENT ON COLUMN security_incidents.linked_risks IS 'M18: Related GRC risks';
COMMENT ON COLUMN security_incidents.linked_policies IS 'M18: Related policies';