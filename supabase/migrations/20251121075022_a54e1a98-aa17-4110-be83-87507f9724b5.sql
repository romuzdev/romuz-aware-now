-- ============================================================
-- M20: Threat Intelligence Module - Database Schema
-- Week 20-22: Threat Intelligence & IOC Management
-- Version: 1.0
-- Created: 2025-11-21
-- ============================================================

-- ============================================================
-- Table 1: threat_intelligence_feeds
-- Purpose: External threat intelligence sources configuration
-- ============================================================

CREATE TABLE threat_intelligence_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feed_name TEXT NOT NULL,
  feed_name_ar TEXT NOT NULL,
  feed_type TEXT NOT NULL CHECK (feed_type IN (
    'ioc',              -- Indicators of Compromise
    'vulnerability',    -- CVE/Vulnerability feeds
    'threat_actor',     -- Threat actor intelligence
    'malware',          -- Malware signatures
    'advisory'          -- Security advisories
  )),
  source_url TEXT,
  source_provider TEXT,  -- 'otx', 'abuse_ch', 'misp', 'custom'
  api_key_configured BOOLEAN DEFAULT false,
  sync_interval_hours INT DEFAULT 24 CHECK (sync_interval_hours > 0),
  last_fetched_at TIMESTAMPTZ,
  last_fetch_status TEXT CHECK (last_fetch_status IN ('success', 'failed', 'pending')),
  last_error_message TEXT,
  total_indicators_fetched INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT threat_intelligence_feeds_tenant_name_unique 
    UNIQUE (tenant_id, feed_name)
);

-- Indexes for performance
CREATE INDEX idx_threat_feeds_tenant_active 
  ON threat_intelligence_feeds(tenant_id, is_active);
  
CREATE INDEX idx_threat_feeds_type 
  ON threat_intelligence_feeds(feed_type);
  
CREATE INDEX idx_threat_feeds_last_fetched 
  ON threat_intelligence_feeds(last_fetched_at DESC)
  WHERE is_active = true;

-- Comments
COMMENT ON TABLE threat_intelligence_feeds IS 
  'External threat intelligence feed sources and configuration';
COMMENT ON COLUMN threat_intelligence_feeds.feed_type IS 
  'Type of threat intelligence: IOC, vulnerability, threat actor, malware, or advisory';
COMMENT ON COLUMN threat_intelligence_feeds.sync_interval_hours IS 
  'How often to sync with this feed (in hours)';
COMMENT ON COLUMN threat_intelligence_feeds.last_backed_up_at IS 
  'Timestamp of the last successful backup for this record';

-- ============================================================
-- Table 2: threat_indicators (IOCs)
-- Purpose: Database of Indicators of Compromise
-- ============================================================

CREATE TABLE threat_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES threat_intelligence_feeds(id) ON DELETE SET NULL,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN (
    'ip',              -- IP Address
    'domain',          -- Domain name
    'url',             -- Full URL
    'file_hash',       -- MD5/SHA1/SHA256
    'email',           -- Email address
    'vulnerability_id' -- CVE-XXXX-XXXX
  )),
  indicator_value TEXT NOT NULL,
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  threat_category TEXT,  -- 'malware', 'phishing', 'botnet', 'c2', etc.
  description_ar TEXT,
  description_en TEXT,
  tags TEXT[] DEFAULT '{}',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detection_count INT DEFAULT 0,
  match_count INT DEFAULT 0,
  is_whitelisted BOOLEAN DEFAULT false,
  whitelisted_at TIMESTAMPTZ,
  whitelisted_by UUID,
  whitelist_reason TEXT,
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  metadata JSONB DEFAULT '{}',
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT threat_indicators_tenant_value_unique 
    UNIQUE (tenant_id, indicator_type, indicator_value)
);

-- Indexes for performance
CREATE INDEX idx_threat_indicators_tenant_active 
  ON threat_indicators(tenant_id, is_whitelisted);
  
CREATE INDEX idx_threat_indicators_type_value 
  ON threat_indicators(indicator_type, indicator_value);
  
CREATE INDEX idx_threat_indicators_level 
  ON threat_indicators(threat_level)
  WHERE is_whitelisted = false;
  
CREATE INDEX idx_threat_indicators_feed 
  ON threat_indicators(feed_id);
  
CREATE INDEX idx_threat_indicators_tags 
  ON threat_indicators USING GIN(tags);
  
CREATE INDEX idx_threat_indicators_last_seen 
  ON threat_indicators(last_seen_at DESC);

-- Comments
COMMENT ON TABLE threat_indicators IS 
  'Database of threat indicators (IOCs) from various feeds';
COMMENT ON COLUMN threat_indicators.indicator_type IS 
  'Type of indicator: IP, domain, URL, file hash, email, or vulnerability ID';
COMMENT ON COLUMN threat_indicators.threat_level IS 
  'Severity of the threat: low, medium, high, or critical';
COMMENT ON COLUMN threat_indicators.detection_count IS 
  'Number of times this indicator was seen in threat feeds';
COMMENT ON COLUMN threat_indicators.match_count IS 
  'Number of times this indicator matched system activity';
COMMENT ON COLUMN threat_indicators.is_whitelisted IS 
  'Whether this indicator is whitelisted (false positive)';
COMMENT ON COLUMN threat_indicators.last_backed_up_at IS 
  'Timestamp of the last successful backup for this record';

-- ============================================================
-- Table 3: threat_matches
-- Purpose: Log of detected threat matches in system
-- ============================================================

CREATE TABLE threat_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES threat_indicators(id) ON DELETE CASCADE,
  matched_entity_type TEXT NOT NULL CHECK (matched_entity_type IN (
    'log',           -- System log entry
    'alert',         -- Alert event
    'incident',      -- Security incident
    'network_event', -- Network activity
    'file_scan'      -- File scan result
  )),
  matched_entity_id UUID,
  matched_value TEXT NOT NULL,  -- The actual value that matched
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken TEXT,  -- 'blocked', 'alerted', 'logged', 'incident_created'
  action_taken_at TIMESTAMPTZ,
  action_taken_by UUID,
  is_false_positive BOOLEAN DEFAULT false,
  false_positive_marked_at TIMESTAMPTZ,
  false_positive_marked_by UUID,
  false_positive_reason TEXT,
  investigation_status TEXT DEFAULT 'pending' CHECK (investigation_status IN (
    'pending', 'investigating', 'confirmed', 'false_positive', 'resolved'
  )),
  investigation_notes TEXT,
  metadata JSONB DEFAULT '{}',
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes inline for related queries
  CONSTRAINT fk_threat_matches_indicator 
    FOREIGN KEY (indicator_id) REFERENCES threat_indicators(id)
);

-- Indexes for performance
CREATE INDEX idx_threat_matches_tenant_status 
  ON threat_matches(tenant_id, investigation_status);
  
CREATE INDEX idx_threat_matches_indicator 
  ON threat_matches(indicator_id);
  
CREATE INDEX idx_threat_matches_entity 
  ON threat_matches(matched_entity_type, matched_entity_id);
  
CREATE INDEX idx_threat_matches_severity 
  ON threat_matches(severity, matched_at DESC);
  
CREATE INDEX idx_threat_matches_false_positive 
  ON threat_matches(is_false_positive, matched_at DESC);
  
CREATE INDEX idx_threat_matches_matched_at 
  ON threat_matches(matched_at DESC);

-- Comments
COMMENT ON TABLE threat_matches IS 
  'Log of threat indicators that matched system activity';
COMMENT ON COLUMN threat_matches.matched_entity_type IS 
  'Type of entity where threat was detected: log, alert, incident, network event, or file scan';
COMMENT ON COLUMN threat_matches.matched_value IS 
  'The actual value that triggered the match (for audit trail)';
COMMENT ON COLUMN threat_matches.action_taken IS 
  'Action taken when threat was detected: blocked, alerted, logged, or incident created';
COMMENT ON COLUMN threat_matches.investigation_status IS 
  'Current status of threat investigation';
COMMENT ON COLUMN threat_matches.last_backed_up_at IS 
  'Timestamp of the last successful backup for this record';

-- ============================================================
-- RLS Policies - Threat Intelligence Feeds
-- ============================================================

ALTER TABLE threat_intelligence_feeds ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view feeds in their tenant
CREATE POLICY "threat_feeds_tenant_isolation_select"
  ON threat_intelligence_feeds
  FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- INSERT: Users can create feeds in their tenant
CREATE POLICY "threat_feeds_tenant_isolation_insert"
  ON threat_intelligence_feeds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1)
    AND created_by = auth.uid()
    AND updated_by = auth.uid()
  );

-- UPDATE: Users can update feeds in their tenant
CREATE POLICY "threat_feeds_tenant_isolation_update"
  ON threat_intelligence_feeds
  FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1)
    AND updated_by = auth.uid()
  );

-- DELETE: Users can delete feeds in their tenant
CREATE POLICY "threat_feeds_tenant_isolation_delete"
  ON threat_intelligence_feeds
  FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- ============================================================
-- RLS Policies - Threat Indicators
-- ============================================================

ALTER TABLE threat_indicators ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view indicators in their tenant
CREATE POLICY "threat_indicators_tenant_isolation_select"
  ON threat_indicators
  FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- INSERT: System and authorized users can insert indicators
CREATE POLICY "threat_indicators_tenant_isolation_insert"
  ON threat_indicators
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- UPDATE: Users can update indicators in their tenant (e.g., whitelist)
CREATE POLICY "threat_indicators_tenant_isolation_update"
  ON threat_indicators
  FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- DELETE: Users can delete indicators in their tenant
CREATE POLICY "threat_indicators_tenant_isolation_delete"
  ON threat_indicators
  FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- ============================================================
-- RLS Policies - Threat Matches
-- ============================================================

ALTER TABLE threat_matches ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view matches in their tenant
CREATE POLICY "threat_matches_tenant_isolation_select"
  ON threat_matches
  FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- INSERT: System can insert matches
CREATE POLICY "threat_matches_tenant_isolation_insert"
  ON threat_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- UPDATE: Users can update matches (investigation status, false positive marking)
CREATE POLICY "threat_matches_tenant_isolation_update"
  ON threat_matches
  FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- DELETE: Users can delete matches in their tenant
CREATE POLICY "threat_matches_tenant_isolation_delete"
  ON threat_matches
  FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- ============================================================
-- Audit Triggers - Transaction Logging
-- ============================================================

-- Trigger for threat_intelligence_feeds
CREATE TRIGGER threat_intelligence_feeds_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON threat_intelligence_feeds
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger for threat_indicators
CREATE TRIGGER threat_indicators_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON threat_indicators
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger for threat_matches
CREATE TRIGGER threat_matches_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON threat_matches
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ============================================================
-- Auto-update timestamps trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION update_threat_intel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update triggers
CREATE TRIGGER threat_feeds_update_timestamp
  BEFORE UPDATE ON threat_intelligence_feeds
  FOR EACH ROW
  EXECUTE FUNCTION update_threat_intel_updated_at();

CREATE TRIGGER threat_indicators_update_timestamp
  BEFORE UPDATE ON threat_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_threat_intel_updated_at();

CREATE TRIGGER threat_matches_update_timestamp
  BEFORE UPDATE ON threat_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_threat_intel_updated_at();

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to increment indicator match count
CREATE OR REPLACE FUNCTION increment_indicator_match_count(p_indicator_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE threat_indicators
  SET 
    match_count = match_count + 1,
    last_seen_at = now()
  WHERE id = p_indicator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get threat statistics
CREATE OR REPLACE FUNCTION get_threat_statistics(p_tenant_id UUID)
RETURNS TABLE (
  total_indicators BIGINT,
  critical_indicators BIGINT,
  high_indicators BIGINT,
  total_matches BIGINT,
  recent_matches_24h BIGINT,
  false_positives BIGINT,
  active_feeds BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM threat_indicators WHERE tenant_id = p_tenant_id AND NOT is_whitelisted),
    (SELECT COUNT(*) FROM threat_indicators WHERE tenant_id = p_tenant_id AND threat_level = 'critical' AND NOT is_whitelisted),
    (SELECT COUNT(*) FROM threat_indicators WHERE tenant_id = p_tenant_id AND threat_level = 'high' AND NOT is_whitelisted),
    (SELECT COUNT(*) FROM threat_matches WHERE tenant_id = p_tenant_id),
    (SELECT COUNT(*) FROM threat_matches WHERE tenant_id = p_tenant_id AND matched_at > now() - interval '24 hours'),
    (SELECT COUNT(*) FROM threat_matches WHERE tenant_id = p_tenant_id AND is_false_positive = true),
    (SELECT COUNT(*) FROM threat_intelligence_feeds WHERE tenant_id = p_tenant_id AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_threat_statistics IS 
  'Returns comprehensive threat intelligence statistics for a tenant';

-- ============================================================
-- Sample Default Feeds (Optional - for testing)
-- ============================================================

-- Note: These will be inserted via Edge Function or UI, not in migration
-- This is just documentation of default feeds that should be available

/*
Default Feeds to be configured:
1. AlienVault OTX - Open Threat Exchange
2. Abuse.ch URLhaus - Malicious URLs
3. Abuse.ch MalwareBazaar - Malware samples
4. MISP - Malware Information Sharing Platform
5. Custom CSV/JSON feeds
*/