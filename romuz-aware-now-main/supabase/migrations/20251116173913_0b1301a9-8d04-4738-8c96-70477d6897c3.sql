-- ============================================================================
-- GRC Week 3: Compliance & Audit Management
-- Database Schema Migration
-- ============================================================================

-- ============================================================================
-- Table 1: grc_compliance_frameworks
-- أطر الامتثال (ISO 27001, NCA ECC, PDPL, NIST CSF, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grc_compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Framework Identification
  framework_code TEXT NOT NULL,
  framework_name TEXT NOT NULL,
  framework_name_ar TEXT,
  framework_version TEXT,
  description TEXT,
  description_ar TEXT,
  
  -- Framework Details
  issuing_authority TEXT,
  framework_type TEXT NOT NULL CHECK (framework_type IN ('regulatory', 'industry_standard', 'best_practice', 'internal')),
  applicability TEXT, -- نطاق التطبيق
  
  -- Status & Tracking
  framework_status TEXT NOT NULL DEFAULT 'active' CHECK (framework_status IN ('active', 'deprecated', 'under_review')),
  effective_date DATE,
  last_review_date DATE,
  next_review_date DATE,
  
  -- Ownership
  owner_user_id UUID,
  
  -- Statistics (auto-calculated)
  total_requirements INTEGER DEFAULT 0,
  compliant_count INTEGER DEFAULT 0,
  non_compliant_count INTEGER DEFAULT 0,
  partial_compliant_count INTEGER DEFAULT 0,
  overall_compliance_score NUMERIC(5,2) DEFAULT 0.00,
  
  -- Metadata
  tags TEXT[],
  external_url TEXT,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_grc_frameworks_tenant_code UNIQUE (tenant_id, framework_code)
);

-- Indexes
CREATE INDEX idx_grc_frameworks_tenant ON public.grc_compliance_frameworks(tenant_id);
CREATE INDEX idx_grc_frameworks_status ON public.grc_compliance_frameworks(framework_status);
CREATE INDEX idx_grc_frameworks_type ON public.grc_compliance_frameworks(framework_type);
CREATE INDEX idx_grc_frameworks_owner ON public.grc_compliance_frameworks(owner_user_id);
CREATE INDEX idx_grc_frameworks_tags ON public.grc_compliance_frameworks USING GIN(tags);

-- RLS Policies
ALTER TABLE public.grc_compliance_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view frameworks in their tenant"
  ON public.grc_compliance_frameworks FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage frameworks"
  ON public.grc_compliance_frameworks FOR ALL
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- Trigger
CREATE TRIGGER update_grc_frameworks_updated_at
  BEFORE UPDATE ON public.grc_compliance_frameworks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.grc_compliance_frameworks IS 'GRC Compliance Frameworks - ISO 27001, NCA ECC, PDPL, etc.';

-- ============================================================================
-- Table 2: grc_compliance_requirements
-- متطلبات الامتثال لكل إطار
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grc_compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  framework_id UUID NOT NULL REFERENCES public.grc_compliance_frameworks(id) ON DELETE CASCADE,
  
  -- Requirement Identification
  requirement_code TEXT NOT NULL,
  requirement_title TEXT NOT NULL,
  requirement_title_ar TEXT,
  requirement_description TEXT,
  requirement_description_ar TEXT,
  
  -- Classification
  category TEXT,
  domain TEXT, -- e.g., "Access Control", "Data Protection"
  control_objective TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Compliance Status
  compliance_status TEXT NOT NULL DEFAULT 'not_assessed' CHECK (
    compliance_status IN ('compliant', 'partially_compliant', 'non_compliant', 'not_assessed', 'not_applicable')
  ),
  
  -- Assessment
  assessment_method TEXT,
  evidence_required TEXT,
  last_assessment_date DATE,
  next_assessment_date DATE,
  
  -- Ownership & Assignment
  owner_user_id UUID,
  responsible_user_id UUID,
  
  -- Links
  linked_control_ids UUID[], -- ربط بالضوابط
  linked_policy_ids UUID[], -- ربط بالسياسات
  linked_risk_ids UUID[], -- ربط بالمخاطر
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  external_reference TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_grc_requirements_framework_code UNIQUE (framework_id, requirement_code)
);

-- Indexes
CREATE INDEX idx_grc_requirements_tenant ON public.grc_compliance_requirements(tenant_id);
CREATE INDEX idx_grc_requirements_framework ON public.grc_compliance_requirements(framework_id);
CREATE INDEX idx_grc_requirements_status ON public.grc_compliance_requirements(compliance_status);
CREATE INDEX idx_grc_requirements_priority ON public.grc_compliance_requirements(priority);
CREATE INDEX idx_grc_requirements_owner ON public.grc_compliance_requirements(owner_user_id);
CREATE INDEX idx_grc_requirements_responsible ON public.grc_compliance_requirements(responsible_user_id);
CREATE INDEX idx_grc_requirements_tags ON public.grc_compliance_requirements USING GIN(tags);
CREATE INDEX idx_grc_requirements_controls ON public.grc_compliance_requirements USING GIN(linked_control_ids);

-- RLS Policies
ALTER TABLE public.grc_compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requirements in their tenant"
  ON public.grc_compliance_requirements FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Compliance managers can manage requirements"
  ON public.grc_compliance_requirements FOR ALL
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
  );

CREATE POLICY "Requirement owners can update their requirements"
  ON public.grc_compliance_requirements FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (owner_user_id = auth.uid() OR responsible_user_id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_grc_requirements_updated_at
  BEFORE UPDATE ON public.grc_compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.grc_compliance_requirements IS 'GRC Compliance Requirements - متطلبات الامتثال';

-- ============================================================================
-- Table 3: grc_compliance_gaps
-- فجوات الامتثال
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grc_compliance_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  requirement_id UUID NOT NULL REFERENCES public.grc_compliance_requirements(id) ON DELETE CASCADE,
  
  -- Gap Identification
  gap_title TEXT NOT NULL,
  gap_title_ar TEXT,
  gap_description TEXT NOT NULL,
  gap_description_ar TEXT,
  
  -- Classification
  gap_type TEXT NOT NULL CHECK (gap_type IN ('policy', 'process', 'technology', 'people', 'documentation')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  
  -- Root Cause
  root_cause TEXT,
  current_state TEXT,
  target_state TEXT,
  
  -- Impact
  business_impact TEXT,
  compliance_risk TEXT,
  
  -- Remediation
  remediation_plan TEXT,
  responsible_user_id UUID,
  target_closure_date DATE,
  estimated_cost NUMERIC(15,2),
  estimated_effort_days INTEGER,
  
  -- Status
  gap_status TEXT NOT NULL DEFAULT 'open' CHECK (
    gap_status IN ('open', 'in_progress', 'remediated', 'accepted', 'mitigated', 'closed')
  ),
  
  -- Tracking
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  identified_by UUID,
  closure_date DATE,
  closed_by UUID,
  
  -- Links
  linked_action_id UUID, -- ربط بخطة عمل
  linked_control_id UUID,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Indexes
CREATE INDEX idx_grc_gaps_tenant ON public.grc_compliance_gaps(tenant_id);
CREATE INDEX idx_grc_gaps_requirement ON public.grc_compliance_gaps(requirement_id);
CREATE INDEX idx_grc_gaps_status ON public.grc_compliance_gaps(gap_status);
CREATE INDEX idx_grc_gaps_severity ON public.grc_compliance_gaps(severity);
CREATE INDEX idx_grc_gaps_responsible ON public.grc_compliance_gaps(responsible_user_id);
CREATE INDEX idx_grc_gaps_target_date ON public.grc_compliance_gaps(target_closure_date);

-- RLS Policies
ALTER TABLE public.grc_compliance_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gaps in their tenant"
  ON public.grc_compliance_gaps FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Compliance managers can manage gaps"
  ON public.grc_compliance_gaps FOR ALL
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
  );

CREATE POLICY "Gap owners can update their gaps"
  ON public.grc_compliance_gaps FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND responsible_user_id = auth.uid()
  );

-- Trigger
CREATE TRIGGER update_grc_gaps_updated_at
  BEFORE UPDATE ON public.grc_compliance_gaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.grc_compliance_gaps IS 'GRC Compliance Gaps - فجوات الامتثال';

-- ============================================================================
-- Table 4: grc_audits
-- عمليات التدقيق
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grc_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Audit Identification
  audit_code TEXT NOT NULL,
  audit_title TEXT NOT NULL,
  audit_title_ar TEXT,
  audit_description TEXT,
  audit_description_ar TEXT,
  
  -- Audit Type & Scope
  audit_type TEXT NOT NULL CHECK (audit_type IN ('internal', 'external', 'compliance', 'operational', 'financial', 'it')),
  audit_scope TEXT NOT NULL,
  framework_id UUID REFERENCES public.grc_compliance_frameworks(id) ON DELETE SET NULL,
  
  -- Planning
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Team
  lead_auditor_id UUID,
  audit_team_ids UUID[],
  
  -- Status
  audit_status TEXT NOT NULL DEFAULT 'planned' CHECK (
    audit_status IN ('planned', 'in_progress', 'fieldwork_complete', 'report_draft', 'report_final', 'closed')
  ),
  
  -- Results Summary
  total_findings INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  high_findings INTEGER DEFAULT 0,
  medium_findings INTEGER DEFAULT 0,
  low_findings INTEGER DEFAULT 0,
  overall_rating TEXT CHECK (overall_rating IN ('satisfactory', 'needs_improvement', 'unsatisfactory')),
  
  -- Reporting
  report_issued_date DATE,
  management_response_date DATE,
  final_report_url TEXT,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_grc_audits_tenant_code UNIQUE (tenant_id, audit_code)
);

-- Indexes
CREATE INDEX idx_grc_audits_tenant ON public.grc_audits(tenant_id);
CREATE INDEX idx_grc_audits_status ON public.grc_audits(audit_status);
CREATE INDEX idx_grc_audits_type ON public.grc_audits(audit_type);
CREATE INDEX idx_grc_audits_framework ON public.grc_audits(framework_id);
CREATE INDEX idx_grc_audits_lead ON public.grc_audits(lead_auditor_id);
CREATE INDEX idx_grc_audits_dates ON public.grc_audits(planned_start_date, planned_end_date);

-- RLS Policies
ALTER TABLE public.grc_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audits in their tenant"
  ON public.grc_audits FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Audit managers can manage audits"
  ON public.grc_audits FOR ALL
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'audit_manager'))
  );

CREATE POLICY "Lead auditors can update their audits"
  ON public.grc_audits FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND lead_auditor_id = auth.uid()
  );

-- Trigger
CREATE TRIGGER update_grc_audits_updated_at
  BEFORE UPDATE ON public.grc_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.grc_audits IS 'GRC Audits - عمليات التدقيق';

-- ============================================================================
-- Table 5: grc_audit_findings
-- نتائج التدقيق
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grc_audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  audit_id UUID NOT NULL REFERENCES public.grc_audits(id) ON DELETE CASCADE,
  
  -- Finding Identification
  finding_code TEXT NOT NULL,
  finding_title TEXT NOT NULL,
  finding_title_ar TEXT,
  finding_description TEXT NOT NULL,
  finding_description_ar TEXT,
  
  -- Classification
  finding_type TEXT NOT NULL CHECK (finding_type IN ('deficiency', 'observation', 'opportunity', 'non_compliance')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),
  category TEXT,
  
  -- Context
  condition TEXT, -- الحالة الحالية
  criteria TEXT, -- المعيار المطلوب
  cause TEXT, -- السبب الجذري
  effect TEXT, -- التأثير
  
  -- Recommendation
  recommendation TEXT NOT NULL,
  recommendation_ar TEXT,
  management_response TEXT,
  management_response_date DATE,
  
  -- Assignment
  responsible_user_id UUID,
  target_closure_date DATE,
  actual_closure_date DATE,
  
  -- Status
  finding_status TEXT NOT NULL DEFAULT 'open' CHECK (
    finding_status IN ('open', 'in_progress', 'resolved', 'verified', 'accepted_risk', 'closed')
  ),
  
  -- Links
  linked_requirement_id UUID,
  linked_control_id UUID,
  linked_risk_id UUID,
  linked_action_id UUID,
  linked_gap_id UUID,
  
  -- Evidence
  evidence_files TEXT[], -- Array of attachment IDs
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  -- Tracking
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  identified_by UUID,
  verified_date DATE,
  verified_by UUID,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_grc_findings_audit_code UNIQUE (audit_id, finding_code)
);

-- Indexes
CREATE INDEX idx_grc_findings_tenant ON public.grc_audit_findings(tenant_id);
CREATE INDEX idx_grc_findings_audit ON public.grc_audit_findings(audit_id);
CREATE INDEX idx_grc_findings_status ON public.grc_audit_findings(finding_status);
CREATE INDEX idx_grc_findings_severity ON public.grc_audit_findings(severity);
CREATE INDEX idx_grc_findings_responsible ON public.grc_audit_findings(responsible_user_id);
CREATE INDEX idx_grc_findings_target_date ON public.grc_audit_findings(target_closure_date);
CREATE INDEX idx_grc_findings_tags ON public.grc_audit_findings USING GIN(tags);

-- RLS Policies
ALTER TABLE public.grc_audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view findings in their tenant"
  ON public.grc_audit_findings FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Auditors can manage findings"
  ON public.grc_audit_findings FOR ALL
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'audit_manager'))
  );

CREATE POLICY "Finding owners can update their findings"
  ON public.grc_audit_findings FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND responsible_user_id = auth.uid()
  );

-- Trigger
CREATE TRIGGER update_grc_findings_updated_at
  BEFORE UPDATE ON public.grc_audit_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.grc_audit_findings IS 'GRC Audit Findings - نتائج التدقيق';

-- ============================================================================
-- Functions: Auto-update framework statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_framework_compliance_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.grc_compliance_frameworks
  SET 
    total_requirements = (
      SELECT COUNT(*) 
      FROM public.grc_compliance_requirements 
      WHERE framework_id = NEW.framework_id
    ),
    compliant_count = (
      SELECT COUNT(*) 
      FROM public.grc_compliance_requirements 
      WHERE framework_id = NEW.framework_id AND compliance_status = 'compliant'
    ),
    partial_compliant_count = (
      SELECT COUNT(*) 
      FROM public.grc_compliance_requirements 
      WHERE framework_id = NEW.framework_id AND compliance_status = 'partially_compliant'
    ),
    non_compliant_count = (
      SELECT COUNT(*) 
      FROM public.grc_compliance_requirements 
      WHERE framework_id = NEW.framework_id AND compliance_status = 'non_compliant'
    ),
    overall_compliance_score = (
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 
          THEN (COUNT(*) FILTER (WHERE compliance_status = 'compliant')::NUMERIC / COUNT(*)) * 100
          ELSE 0
        END
      FROM public.grc_compliance_requirements 
      WHERE framework_id = NEW.framework_id
    ),
    updated_at = now()
  WHERE id = NEW.framework_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update framework stats when requirements change
CREATE TRIGGER trigger_update_framework_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.grc_compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_framework_compliance_stats();

-- ============================================================================
-- Function: Auto-update audit findings count
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_audit_findings_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.grc_audits
  SET 
    total_findings = (
      SELECT COUNT(*) 
      FROM public.grc_audit_findings 
      WHERE audit_id = NEW.audit_id
    ),
    critical_findings = (
      SELECT COUNT(*) 
      FROM public.grc_audit_findings 
      WHERE audit_id = NEW.audit_id AND severity = 'critical'
    ),
    high_findings = (
      SELECT COUNT(*) 
      FROM public.grc_audit_findings 
      WHERE audit_id = NEW.audit_id AND severity = 'high'
    ),
    medium_findings = (
      SELECT COUNT(*) 
      FROM public.grc_audit_findings 
      WHERE audit_id = NEW.audit_id AND severity = 'medium'
    ),
    low_findings = (
      SELECT COUNT(*) 
      FROM public.grc_audit_findings 
      WHERE audit_id = NEW.audit_id AND severity = 'low'
    ),
    updated_at = now()
  WHERE id = NEW.audit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update audit findings count
CREATE TRIGGER trigger_update_audit_findings
  AFTER INSERT OR UPDATE OR DELETE ON public.grc_audit_findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_findings_count();