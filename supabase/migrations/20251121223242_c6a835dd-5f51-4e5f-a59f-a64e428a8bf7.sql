-- ============================================================================
-- M20 - Threat Intelligence: Database Schema Enhancement
-- Part 1: Adding Missing Tables & Backup/Audit Improvements
-- ============================================================================

-- ============================================================================
-- 1. THREAT ACTOR PROFILES TABLE (New)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.threat_actor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Actor Identification
  actor_name TEXT NOT NULL,
  actor_aliases TEXT[],
  actor_type TEXT NOT NULL CHECK (actor_type IN (
    'apt', 'cybercrime_group', 'hacktivist', 
    'insider_threat', 'nation_state', 'script_kiddie', 'unknown'
  )),
  
  -- Attribution
  suspected_country TEXT,
  suspected_affiliation TEXT,
  confidence_level TEXT DEFAULT 'low' CHECK (confidence_level IN (
    'very_low', 'low', 'medium', 'high', 'very_high'
  )),
  
  -- Characteristics
  sophistication_level TEXT DEFAULT 'medium' CHECK (sophistication_level IN (
    'very_low', 'low', 'medium', 'high', 'very_high'
  )),
  primary_motivation TEXT[],
  target_sectors TEXT[],
  target_regions TEXT[],
  
  -- TTPs
  ttps JSONB DEFAULT '[]'::jsonb,
  known_tools TEXT[],
  known_malware TEXT[],
  preferred_attack_vectors TEXT[],
  
  -- Activity
  first_observed TIMESTAMPTZ,
  last_observed TIMESTAMPTZ,
  activity_status TEXT DEFAULT 'active' CHECK (activity_status IN (
    'active', 'dormant', 'retired', 'unknown'
  )),
  
  -- Intelligence
  description_ar TEXT,
  description_en TEXT,
  intelligence_sources TEXT[],
  related_campaigns TEXT[],
  associated_indicators_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  external_references JSONB DEFAULT '[]'::jsonb,
  
  -- Audit & Backup
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  last_backed_up_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_threat_actors_tenant ON public.threat_actor_profiles(tenant_id);
CREATE INDEX idx_threat_actors_type ON public.threat_actor_profiles(tenant_id, actor_type);
CREATE INDEX idx_threat_actors_status ON public.threat_actor_profiles(tenant_id, activity_status);
CREATE INDEX idx_threat_actors_last_observed ON public.threat_actor_profiles(tenant_id, last_observed DESC);
CREATE INDEX idx_threat_actors_last_backed_up ON public.threat_actor_profiles(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- RLS
ALTER TABLE public.threat_actor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "threat_actors_tenant_isolation_select"
ON public.threat_actor_profiles FOR SELECT
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "threat_actors_tenant_isolation_insert"
ON public.threat_actor_profiles FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "threat_actors_tenant_isolation_update"
ON public.threat_actor_profiles FOR UPDATE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1))
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "threat_actors_tenant_isolation_delete"
ON public.threat_actor_profiles FOR DELETE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- Audit Trigger
CREATE TRIGGER threat_actors_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_actor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- ============================================================================
-- 2. MITRE ATT&CK MAPPING TABLE (New)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mitre_attack_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Entity Reference
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'threat_indicator', 'threat_actor', 'security_event', 
    'incident', 'threat_campaign'
  )),
  entity_id UUID NOT NULL,
  
  -- MITRE ATT&CK Framework
  mitre_tactic_id TEXT NOT NULL,
  mitre_tactic_name TEXT NOT NULL,
  mitre_technique_id TEXT NOT NULL,
  mitre_technique_name TEXT NOT NULL,
  mitre_subtechnique_id TEXT,
  mitre_subtechnique_name TEXT,
  
  -- Confidence & Evidence
  confidence_score NUMERIC(3,2) DEFAULT 0.70 CHECK (confidence_score BETWEEN 0 AND 1),
  detection_method TEXT CHECK (detection_method IN (
    'automated', 'manual', 'ai_analysis', 'threat_intel'
  )),
  evidence_description TEXT,
  
  -- Metadata
  mitre_matrix TEXT DEFAULT 'enterprise' CHECK (mitre_matrix IN (
    'enterprise', 'mobile', 'ics'
  )),
  platforms TEXT[],
  data_sources TEXT[],
  
  -- Status
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  
  -- Audit & Backup
  mapped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mapped_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_mitre_mapping_tenant ON public.mitre_attack_mapping(tenant_id);
CREATE INDEX idx_mitre_mapping_entity ON public.mitre_attack_mapping(entity_type, entity_id);
CREATE INDEX idx_mitre_mapping_tactic ON public.mitre_attack_mapping(tenant_id, mitre_tactic_id);
CREATE INDEX idx_mitre_mapping_technique ON public.mitre_attack_mapping(tenant_id, mitre_technique_id);
CREATE INDEX idx_mitre_mapping_confirmed ON public.mitre_attack_mapping(tenant_id, is_confirmed);
CREATE INDEX idx_mitre_mapping_last_backed_up ON public.mitre_attack_mapping(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- RLS
ALTER TABLE public.mitre_attack_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mitre_mapping_tenant_isolation_select"
ON public.mitre_attack_mapping FOR SELECT
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "mitre_mapping_tenant_isolation_insert"
ON public.mitre_attack_mapping FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "mitre_mapping_tenant_isolation_update"
ON public.mitre_attack_mapping FOR UPDATE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1))
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "mitre_mapping_tenant_isolation_delete"
ON public.mitre_attack_mapping FOR DELETE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1));

-- Audit Trigger
CREATE TRIGGER mitre_mapping_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.mitre_attack_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- ============================================================================
-- 3. ADD BACKUP METADATA TO EXISTING THREAT INTELLIGENCE TABLES
-- ============================================================================

-- threat_indicators
ALTER TABLE public.threat_indicators 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_threat_indicators_last_backed_up 
ON public.threat_indicators(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

-- threat_intelligence_feeds
ALTER TABLE public.threat_intelligence_feeds 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_threat_feeds_last_backed_up 
ON public.threat_intelligence_feeds(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

-- threat_matches
ALTER TABLE public.threat_matches 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_threat_matches_last_backed_up 
ON public.threat_matches(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

-- security_event_threat_matches
ALTER TABLE public.security_event_threat_matches 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_event_threat_matches_last_backed_up 
ON public.security_event_threat_matches(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

-- ============================================================================
-- 4. ADD AUDIT TRIGGERS TO EXISTING TABLES
-- ============================================================================

-- threat_indicators
DROP TRIGGER IF EXISTS threat_indicators_audit_trigger ON public.threat_indicators;
CREATE TRIGGER threat_indicators_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_indicators
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- threat_intelligence_feeds
DROP TRIGGER IF EXISTS threat_feeds_audit_trigger ON public.threat_intelligence_feeds;
CREATE TRIGGER threat_feeds_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_intelligence_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- threat_matches
DROP TRIGGER IF EXISTS threat_matches_audit_trigger ON public.threat_matches;
CREATE TRIGGER threat_matches_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- security_event_threat_matches
DROP TRIGGER IF EXISTS event_threat_matches_audit_trigger ON public.security_event_threat_matches;
CREATE TRIGGER event_threat_matches_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.security_event_threat_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- threat_hunt_queries
DROP TRIGGER IF EXISTS threat_hunt_queries_audit_trigger ON public.threat_hunt_queries;
CREATE TRIGGER threat_hunt_queries_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_hunt_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- threat_hunt_results
DROP TRIGGER IF EXISTS threat_hunt_results_audit_trigger ON public.threat_hunt_results;
CREATE TRIGGER threat_hunt_results_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_hunt_results
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- ============================================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE public.threat_actor_profiles IS 'M20 - Known threat actor profiles and their characteristics';
COMMENT ON TABLE public.mitre_attack_mapping IS 'M20 - Mapping of entities to MITRE ATT&CK framework';

COMMENT ON COLUMN public.threat_indicators.last_backed_up_at IS 'Timestamp of last successful backup';
COMMENT ON COLUMN public.threat_intelligence_feeds.last_backed_up_at IS 'Timestamp of last successful backup';
COMMENT ON COLUMN public.threat_matches.last_backed_up_at IS 'Timestamp of last successful backup';
COMMENT ON COLUMN public.security_event_threat_matches.last_backed_up_at IS 'Timestamp of last successful backup';
COMMENT ON COLUMN public.threat_actor_profiles.last_backed_up_at IS 'Timestamp of last successful backup';
COMMENT ON COLUMN public.mitre_attack_mapping.last_backed_up_at IS 'Timestamp of last successful backup';