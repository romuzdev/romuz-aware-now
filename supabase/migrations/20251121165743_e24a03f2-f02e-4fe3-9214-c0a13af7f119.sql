-- =====================================================
-- M18.5 Enhancement: Threat Hunting & Integrations
-- =====================================================

-- 1. Create threat hunt queries table
CREATE TABLE threat_hunt_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  query_name text NOT NULL,
  description_ar text,
  query_type text NOT NULL,
  query_config jsonb NOT NULL DEFAULT '{}',
  saved_filters jsonb DEFAULT '{}',
  is_scheduled boolean DEFAULT false,
  schedule_cron text,
  last_executed_at timestamptz,
  execution_count integer DEFAULT 0,
  results_count integer DEFAULT 0,
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_backed_up_at timestamptz
);

CREATE INDEX idx_threat_hunt_queries_tenant ON threat_hunt_queries(tenant_id);
CREATE INDEX idx_threat_hunt_queries_created_by ON threat_hunt_queries(created_by);
CREATE INDEX idx_threat_hunt_queries_type ON threat_hunt_queries(query_type);
CREATE INDEX idx_threat_hunt_queries_active ON threat_hunt_queries(is_active) WHERE is_active = true;

ALTER TABLE threat_hunt_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY threat_hunt_queries_select ON threat_hunt_queries
  FOR SELECT USING (tenant_id = app_current_tenant_id());

CREATE POLICY threat_hunt_queries_insert ON threat_hunt_queries
  FOR INSERT WITH CHECK (tenant_id = app_current_tenant_id() AND created_by = app_current_user_id());

CREATE POLICY threat_hunt_queries_update ON threat_hunt_queries
  FOR UPDATE USING (tenant_id = app_current_tenant_id());

CREATE POLICY threat_hunt_queries_delete ON threat_hunt_queries
  FOR DELETE USING (tenant_id = app_current_tenant_id());

-- 2. Create threat hunt results table
CREATE TABLE threat_hunt_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  query_id uuid NOT NULL REFERENCES threat_hunt_queries(id) ON DELETE CASCADE,
  executed_by uuid NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now(),
  results_data jsonb NOT NULL DEFAULT '[]',
  matched_events_count integer DEFAULT 0,
  matched_indicators_count integer DEFAULT 0,
  execution_time_ms integer,
  status text DEFAULT 'completed',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_threat_hunt_results_tenant ON threat_hunt_results(tenant_id);
CREATE INDEX idx_threat_hunt_results_query ON threat_hunt_results(query_id);
CREATE INDEX idx_threat_hunt_results_executed_at ON threat_hunt_results(executed_at DESC);

ALTER TABLE threat_hunt_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY threat_hunt_results_select ON threat_hunt_results
  FOR SELECT USING (tenant_id = app_current_tenant_id());

CREATE POLICY threat_hunt_results_insert ON threat_hunt_results
  FOR INSERT WITH CHECK (tenant_id = app_current_tenant_id() AND executed_by = app_current_user_id());

-- 3. Create security_event_threat_matches for M20 integration
CREATE TABLE security_event_threat_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES security_events(id) ON DELETE CASCADE,
  indicator_id uuid NOT NULL REFERENCES threat_indicators(id) ON DELETE CASCADE,
  match_type text NOT NULL,
  match_value text NOT NULL,
  confidence_score numeric(3,2) DEFAULT 0.5,
  matched_at timestamptz NOT NULL DEFAULT now(),
  is_confirmed boolean DEFAULT false,
  confirmed_by uuid,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_threat_matches_tenant ON security_event_threat_matches(tenant_id);
CREATE INDEX idx_event_threat_matches_event ON security_event_threat_matches(event_id);
CREATE INDEX idx_event_threat_matches_indicator ON security_event_threat_matches(indicator_id);
CREATE INDEX idx_event_threat_matches_matched_at ON security_event_threat_matches(matched_at DESC);
CREATE UNIQUE INDEX idx_event_threat_matches_unique ON security_event_threat_matches(event_id, indicator_id);

ALTER TABLE security_event_threat_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_threat_matches_select ON security_event_threat_matches
  FOR SELECT USING (tenant_id = app_current_tenant_id());

CREATE POLICY event_threat_matches_insert ON security_event_threat_matches
  FOR INSERT WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY event_threat_matches_update ON security_event_threat_matches
  FOR UPDATE USING (tenant_id = app_current_tenant_id());

CREATE POLICY event_threat_matches_delete ON security_event_threat_matches
  FOR DELETE USING (tenant_id = app_current_tenant_id());

-- 4. Trigger for updated_at
CREATE TRIGGER trg_threat_hunt_queries_updated_at
  BEFORE UPDATE ON threat_hunt_queries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create view for threat hunting dashboard
CREATE OR REPLACE VIEW vw_threat_hunt_dashboard AS
SELECT 
  q.tenant_id,
  COUNT(DISTINCT q.id) as total_queries,
  COUNT(DISTINCT q.id) FILTER (WHERE q.is_active = true) as active_queries,
  COUNT(DISTINCT r.id) as total_executions,
  COALESCE(SUM(r.matched_events_count), 0) as total_matches,
  MAX(r.executed_at) as last_execution
FROM threat_hunt_queries q
LEFT JOIN threat_hunt_results r ON q.id = r.query_id
GROUP BY q.tenant_id;