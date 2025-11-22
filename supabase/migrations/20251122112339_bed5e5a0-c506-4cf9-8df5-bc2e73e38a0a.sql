-- ====================================================================
-- Phase 3 - Part 2: Third-Party Risk Management + Advanced Reporting
-- ====================================================================

-- ============================================================
-- 1) Third-Party Risk Management Tables
-- ============================================================

-- Third-party vendors/suppliers registry
CREATE TABLE IF NOT EXISTS grc_third_party_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_code TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_name_ar TEXT,
  business_contact TEXT,
  technical_contact TEXT,
  vendor_type TEXT NOT NULL, -- supplier, service_provider, partner, contractor
  criticality TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  services_provided TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  contract_value DECIMAL(15,2),
  country TEXT,
  industry TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, suspended, terminated, under_review
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ,
  UNIQUE(tenant_id, vendor_code)
);

CREATE INDEX idx_grc_third_party_vendors_tenant ON grc_third_party_vendors(tenant_id);
CREATE INDEX idx_grc_third_party_vendors_status ON grc_third_party_vendors(tenant_id, status);
CREATE INDEX idx_grc_third_party_vendors_criticality ON grc_third_party_vendors(tenant_id, criticality);
CREATE INDEX idx_grc_third_party_vendors_backup ON grc_third_party_vendors(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NULL;

-- Third-party risk assessments
CREATE TABLE IF NOT EXISTS grc_third_party_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES grc_third_party_vendors(id) ON DELETE CASCADE,
  assessment_code TEXT NOT NULL,
  assessment_date DATE NOT NULL,
  assessor_id UUID,
  assessment_type TEXT NOT NULL, -- initial, periodic, incident_driven, contract_renewal
  scope TEXT,
  
  -- Risk scores
  security_score INTEGER CHECK (security_score BETWEEN 0 AND 100),
  privacy_score INTEGER CHECK (privacy_score BETWEEN 0 AND 100),
  financial_score INTEGER CHECK (financial_score BETWEEN 0 AND 100),
  operational_score INTEGER CHECK (operational_score BETWEEN 0 AND 100),
  compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
  overall_risk_score INTEGER CHECK (overall_risk_score BETWEEN 0 AND 100),
  risk_rating TEXT, -- low, medium, high, critical
  
  findings TEXT,
  recommendations TEXT,
  remediation_plan TEXT,
  remediation_deadline DATE,
  next_review_date DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, in_progress, completed, approved
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ,
  UNIQUE(tenant_id, assessment_code)
);

CREATE INDEX idx_grc_tpra_tenant ON grc_third_party_risk_assessments(tenant_id);
CREATE INDEX idx_grc_tpra_vendor ON grc_third_party_risk_assessments(vendor_id);
CREATE INDEX idx_grc_tpra_status ON grc_third_party_risk_assessments(tenant_id, status);
CREATE INDEX idx_grc_tpra_rating ON grc_third_party_risk_assessments(tenant_id, risk_rating);
CREATE INDEX idx_grc_tpra_backup ON grc_third_party_risk_assessments(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NULL;

-- Third-party due diligence documents
CREATE TABLE IF NOT EXISTS grc_third_party_due_diligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES grc_third_party_vendors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- certificate, policy, audit_report, contract, sla, compliance_doc
  document_name TEXT NOT NULL,
  document_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'valid', -- valid, expired, pending_renewal, missing
  verification_status TEXT, -- verified, pending, rejected
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

CREATE INDEX idx_grc_tpdd_tenant ON grc_third_party_due_diligence(tenant_id);
CREATE INDEX idx_grc_tpdd_vendor ON grc_third_party_due_diligence(vendor_id);
CREATE INDEX idx_grc_tpdd_status ON grc_third_party_due_diligence(tenant_id, status);
CREATE INDEX idx_grc_tpdd_expiry ON grc_third_party_due_diligence(tenant_id, expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_grc_tpdd_backup ON grc_third_party_due_diligence(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NULL;

-- ============================================================
-- 2) Advanced GRC Reporting Functions
-- ============================================================

-- Generate Executive Risk Dashboard
CREATE OR REPLACE FUNCTION fn_grc_executive_risk_dashboard(
  p_tenant_id UUID,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
)
RETURNS TABLE(
  total_risks INTEGER,
  critical_risks INTEGER,
  high_risks INTEGER,
  risk_trend TEXT,
  total_controls INTEGER,
  effective_controls INTEGER,
  control_effectiveness_pct DECIMAL(5,2),
  total_audits INTEGER,
  completed_audits INTEGER,
  total_findings INTEGER,
  critical_findings INTEGER,
  compliance_score DECIMAL(5,2),
  third_party_vendors INTEGER,
  high_risk_vendors INTEGER,
  kpi_summary JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_start DATE := COALESCE(p_period_start, CURRENT_DATE - INTERVAL '90 days');
  v_period_end DATE := COALESCE(p_period_end, CURRENT_DATE);
  v_risk_count INTEGER;
  v_previous_risk_count INTEGER;
BEGIN
  -- Count current risks
  SELECT COUNT(*) INTO v_risk_count
  FROM grc_risks
  WHERE tenant_id = p_tenant_id
    AND status NOT IN ('closed', 'mitigated');

  -- Count risks from previous period for trend
  SELECT COUNT(*) INTO v_previous_risk_count
  FROM grc_risks
  WHERE tenant_id = p_tenant_id
    AND status NOT IN ('closed', 'mitigated')
    AND created_at < v_period_start;

  RETURN QUERY
  WITH risk_metrics AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE likelihood_score * impact_score >= 20) as critical,
      COUNT(*) FILTER (WHERE likelihood_score * impact_score >= 12 AND likelihood_score * impact_score < 20) as high
    FROM grc_risks
    WHERE tenant_id = p_tenant_id
      AND status NOT IN ('closed', 'mitigated')
  ),
  control_metrics AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE effectiveness_rating = 'effective') as effective
    FROM grc_controls
    WHERE tenant_id = p_tenant_id
      AND status = 'active'
  ),
  audit_metrics AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM grc_audits
    WHERE tenant_id = p_tenant_id
      AND audit_date BETWEEN v_period_start AND v_period_end
  ),
  finding_metrics AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE severity IN ('critical', 'high')) as critical
    FROM audit_findings_categories
    WHERE tenant_id = p_tenant_id
      AND created_at BETWEEN v_period_start AND v_period_end
  ),
  compliance_metrics AS (
    SELECT
      COALESCE(AVG(CASE 
        WHEN status = 'compliant' THEN 100
        WHEN status = 'partially_compliant' THEN 50
        ELSE 0
      END), 0) as score
    FROM grc_compliance_requirements
    WHERE tenant_id = p_tenant_id
  ),
  vendor_metrics AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE criticality IN ('high', 'critical')) as high_risk
    FROM grc_third_party_vendors
    WHERE tenant_id = p_tenant_id
      AND status = 'active'
  )
  SELECT
    rm.total::INTEGER,
    rm.critical::INTEGER,
    rm.high::INTEGER,
    CASE
      WHEN v_risk_count > v_previous_risk_count THEN 'increasing'
      WHEN v_risk_count < v_previous_risk_count THEN 'decreasing'
      ELSE 'stable'
    END::TEXT,
    cm.total::INTEGER,
    cm.effective::INTEGER,
    CASE WHEN cm.total > 0 THEN ROUND((cm.effective::DECIMAL / cm.total) * 100, 2) ELSE 0 END,
    am.total::INTEGER,
    am.completed::INTEGER,
    fm.total::INTEGER,
    fm.critical::INTEGER,
    ROUND(comp.score, 2),
    vm.total::INTEGER,
    vm.high_risk::INTEGER,
    jsonb_build_object(
      'period_start', v_period_start,
      'period_end', v_period_end,
      'generated_at', now()
    )
  FROM risk_metrics rm
  CROSS JOIN control_metrics cm
  CROSS JOIN audit_metrics am
  CROSS JOIN finding_metrics fm
  CROSS JOIN compliance_metrics comp
  CROSS JOIN vendor_metrics vm;
END;
$$;

-- Generate Compliance Status Report
CREATE OR REPLACE FUNCTION fn_grc_compliance_status_report(
  p_tenant_id UUID,
  p_framework TEXT DEFAULT NULL
)
RETURNS TABLE(
  framework_code TEXT,
  framework_name TEXT,
  total_requirements INTEGER,
  compliant INTEGER,
  partially_compliant INTEGER,
  non_compliant INTEGER,
  not_assessed INTEGER,
  compliance_percentage DECIMAL(5,2),
  overdue_requirements INTEGER,
  upcoming_deadlines INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.framework_code,
    cf.framework_name,
    COUNT(cr.id)::INTEGER as total_requirements,
    COUNT(*) FILTER (WHERE cr.status = 'compliant')::INTEGER as compliant,
    COUNT(*) FILTER (WHERE cr.status = 'partially_compliant')::INTEGER as partially_compliant,
    COUNT(*) FILTER (WHERE cr.status = 'non_compliant')::INTEGER as non_compliant,
    COUNT(*) FILTER (WHERE cr.status IS NULL OR cr.status = 'not_assessed')::INTEGER as not_assessed,
    CASE 
      WHEN COUNT(cr.id) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE cr.status = 'compliant')::DECIMAL / COUNT(cr.id)) * 100, 2)
      ELSE 0
    END as compliance_percentage,
    COUNT(*) FILTER (WHERE cr.due_date < CURRENT_DATE AND cr.status != 'compliant')::INTEGER as overdue,
    COUNT(*) FILTER (WHERE cr.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::INTEGER as upcoming
  FROM grc_compliance_frameworks cf
  LEFT JOIN grc_compliance_requirements cr ON cf.id = cr.framework_id
  WHERE cf.tenant_id = p_tenant_id
    AND (p_framework IS NULL OR cf.framework_code = p_framework)
  GROUP BY cf.framework_code, cf.framework_name
  ORDER BY cf.framework_code;
END;
$$;

-- Generate Control Effectiveness Report
CREATE OR REPLACE FUNCTION fn_grc_control_effectiveness_report(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  control_type TEXT,
  total_controls INTEGER,
  tested_controls INTEGER,
  effective INTEGER,
  partially_effective INTEGER,
  ineffective INTEGER,
  not_tested INTEGER,
  effectiveness_rate DECIMAL(5,2),
  avg_test_score DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '90 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT
    c.control_type,
    COUNT(DISTINCT c.id)::INTEGER as total_controls,
    COUNT(DISTINCT ct.control_id)::INTEGER as tested_controls,
    COUNT(*) FILTER (WHERE ct.effectiveness = 'effective')::INTEGER as effective,
    COUNT(*) FILTER (WHERE ct.effectiveness = 'partially_effective')::INTEGER as partially_effective,
    COUNT(*) FILTER (WHERE ct.effectiveness = 'ineffective')::INTEGER as ineffective,
    (COUNT(DISTINCT c.id) - COUNT(DISTINCT ct.control_id))::INTEGER as not_tested,
    CASE 
      WHEN COUNT(ct.id) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE ct.effectiveness = 'effective')::DECIMAL / COUNT(ct.id)) * 100, 2)
      ELSE 0
    END as effectiveness_rate,
    COALESCE(ROUND(AVG(ct.test_score), 2), 0) as avg_test_score
  FROM grc_controls c
  LEFT JOIN grc_control_tests ct ON c.id = ct.control_id 
    AND ct.test_date BETWEEN v_start_date AND v_end_date
  WHERE c.tenant_id = p_tenant_id
    AND c.status = 'active'
  GROUP BY c.control_type
  ORDER BY c.control_type;
END;
$$;

-- ============================================================
-- 3) RLS Policies
-- ============================================================

ALTER TABLE grc_third_party_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE grc_third_party_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grc_third_party_due_diligence ENABLE ROW LEVEL SECURITY;

-- Policies for grc_third_party_vendors
CREATE POLICY "Users can view vendors in their tenant"
  ON grc_third_party_vendors FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can create vendors in their tenant"
  ON grc_third_party_vendors FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update vendors in their tenant"
  ON grc_third_party_vendors FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete vendors in their tenant"
  ON grc_third_party_vendors FOR DELETE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policies for grc_third_party_risk_assessments
CREATE POLICY "Users can view TPRA in their tenant"
  ON grc_third_party_risk_assessments FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can create TPRA in their tenant"
  ON grc_third_party_risk_assessments FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update TPRA in their tenant"
  ON grc_third_party_risk_assessments FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete TPRA in their tenant"
  ON grc_third_party_risk_assessments FOR DELETE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policies for grc_third_party_due_diligence
CREATE POLICY "Users can view DD docs in their tenant"
  ON grc_third_party_due_diligence FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can create DD docs in their tenant"
  ON grc_third_party_due_diligence FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update DD docs in their tenant"
  ON grc_third_party_due_diligence FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete DD docs in their tenant"
  ON grc_third_party_due_diligence FOR DELETE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);