-- =====================================================
-- Phase 3 - Part 2: Third-Party Risk Management
-- Migration: Vendor and Third-Party Risk Tables (Fixed)
-- =====================================================

-- ========================================
-- Table: vendors
-- Purpose: Master registry of all vendors/suppliers
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Basic Information
  vendor_code VARCHAR(50) NOT NULL,
  vendor_name_ar TEXT NOT NULL,
  vendor_name_en TEXT,
  vendor_type VARCHAR(50) NOT NULL, -- 'supplier', 'service_provider', 'contractor', 'consultant', 'technology_vendor'
  
  -- Business Details
  industry VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  website VARCHAR(255),
  tax_number VARCHAR(100),
  registration_number VARCHAR(100),
  
  -- Risk Classification
  risk_tier VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  risk_score NUMERIC(5,2) DEFAULT 50.00,
  overall_risk_level VARCHAR(20) DEFAULT 'medium',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'active', 'suspended', 'terminated'
  approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Contract Info
  contract_start_date DATE,
  contract_end_date DATE,
  contract_value NUMERIC(15,2),
  contract_currency VARCHAR(10) DEFAULT 'SAR',
  
  -- Security & Compliance
  has_data_access BOOLEAN DEFAULT false,
  data_classification VARCHAR(20), -- 'public', 'internal', 'confidential', 'restricted'
  has_iso27001 BOOLEAN DEFAULT false,
  has_soc2 BOOLEAN DEFAULT false,
  has_pdpl_compliance BOOLEAN DEFAULT false,
  
  -- Review Dates
  last_assessment_date DATE,
  next_assessment_date DATE,
  assessment_frequency_days INTEGER DEFAULT 365,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID NOT NULL,
  
  CONSTRAINT vendors_tenant_code_unique UNIQUE (tenant_id, vendor_code),
  CONSTRAINT vendors_risk_score_check CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Indexes
CREATE INDEX idx_vendors_tenant_id ON public.vendors(tenant_id);
CREATE INDEX idx_vendors_status ON public.vendors(status);
CREATE INDEX idx_vendors_risk_tier ON public.vendors(risk_tier);
CREATE INDEX idx_vendors_vendor_type ON public.vendors(vendor_type);
CREATE INDEX idx_vendors_next_assessment ON public.vendors(next_assessment_date);
CREATE INDEX idx_vendors_created_at ON public.vendors(created_at DESC);

-- RLS Policies
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_tenant_isolation" ON public.vendors
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "vendors_select" ON public.vendors
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "vendors_insert" ON public.vendors
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    created_by = auth.uid()
  );

CREATE POLICY "vendors_update" ON public.vendors
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    updated_by = auth.uid()
  );

CREATE POLICY "vendors_delete" ON public.vendors
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- ========================================
-- Table: vendor_contacts
-- Purpose: Contact persons for each vendor
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Contact Info
  full_name TEXT NOT NULL,
  job_title TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  -- Type
  contact_type VARCHAR(50) NOT NULL, -- 'primary', 'technical', 'commercial', 'security', 'compliance'
  is_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT vendor_contacts_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_vendor_contacts_tenant_id ON public.vendor_contacts(tenant_id);
CREATE INDEX idx_vendor_contacts_vendor_id ON public.vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_contacts_contact_type ON public.vendor_contacts(contact_type);

-- RLS Policies
ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_contacts_tenant_isolation" ON public.vendor_contacts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ========================================
-- Table: vendor_risk_assessments
-- Purpose: Risk assessments for vendors
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendor_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Assessment Details
  assessment_code VARCHAR(50) NOT NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessment_type VARCHAR(50) NOT NULL, -- 'initial', 'annual', 'ad_hoc', 'incident_driven'
  
  -- Assessor Info
  assessor_user_id UUID NOT NULL,
  assessor_name TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  
  -- Risk Scores (0-100)
  security_risk_score NUMERIC(5,2) DEFAULT 50.00,
  financial_risk_score NUMERIC(5,2) DEFAULT 50.00,
  operational_risk_score NUMERIC(5,2) DEFAULT 50.00,
  compliance_risk_score NUMERIC(5,2) DEFAULT 50.00,
  reputational_risk_score NUMERIC(5,2) DEFAULT 50.00,
  
  -- Calculated Overall
  overall_risk_score NUMERIC(5,2) DEFAULT 50.00,
  overall_risk_level VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  
  -- Assessment Results
  findings_summary_ar TEXT,
  findings_summary_en TEXT,
  recommendations_ar TEXT,
  recommendations_en TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed', 'approved', 'rejected'
  
  -- Follow-up
  requires_followup BOOLEAN DEFAULT false,
  followup_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID NOT NULL,
  
  CONSTRAINT vendor_risk_assessments_tenant_code_unique UNIQUE (tenant_id, assessment_code),
  CONSTRAINT vendor_risk_assessments_scores_check CHECK (
    security_risk_score >= 0 AND security_risk_score <= 100 AND
    financial_risk_score >= 0 AND financial_risk_score <= 100 AND
    operational_risk_score >= 0 AND operational_risk_score <= 100 AND
    compliance_risk_score >= 0 AND compliance_risk_score <= 100 AND
    reputational_risk_score >= 0 AND reputational_risk_score <= 100 AND
    overall_risk_score >= 0 AND overall_risk_score <= 100
  )
);

-- Indexes
CREATE INDEX idx_vendor_risk_assessments_tenant_id ON public.vendor_risk_assessments(tenant_id);
CREATE INDEX idx_vendor_risk_assessments_vendor_id ON public.vendor_risk_assessments(vendor_id);
CREATE INDEX idx_vendor_risk_assessments_status ON public.vendor_risk_assessments(status);
CREATE INDEX idx_vendor_risk_assessments_date ON public.vendor_risk_assessments(assessment_date DESC);
CREATE INDEX idx_vendor_risk_assessments_overall_risk ON public.vendor_risk_assessments(overall_risk_level);

-- RLS Policies
ALTER TABLE public.vendor_risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_risk_assessments_tenant_isolation" ON public.vendor_risk_assessments
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ========================================
-- Table: vendor_contracts
-- Purpose: Contract management for vendors
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Contract Details
  contract_code VARCHAR(50) NOT NULL,
  contract_title_ar TEXT NOT NULL,
  contract_title_en TEXT,
  contract_type VARCHAR(50) NOT NULL, -- 'master_agreement', 'sow', 'nda', 'sla', 'dpa', 'purchase_order'
  
  -- Dates
  effective_date DATE NOT NULL,
  expiry_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  
  -- Financial
  contract_value NUMERIC(15,2),
  currency VARCHAR(10) DEFAULT 'SAR',
  payment_terms TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_approval', 'active', 'expired', 'terminated'
  
  -- Approvals
  requires_legal_review BOOLEAN DEFAULT true,
  legal_reviewed_by UUID,
  legal_reviewed_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Terms & Conditions
  has_termination_clause BOOLEAN DEFAULT false,
  has_liability_clause BOOLEAN DEFAULT false,
  has_data_protection_clause BOOLEAN DEFAULT false,
  has_confidentiality_clause BOOLEAN DEFAULT false,
  
  -- Documents
  document_urls TEXT[],
  
  -- Renewal
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_sent BOOLEAN DEFAULT false,
  renewal_reminder_date DATE,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID NOT NULL,
  
  CONSTRAINT vendor_contracts_tenant_code_unique UNIQUE (tenant_id, contract_code)
);

-- Indexes
CREATE INDEX idx_vendor_contracts_tenant_id ON public.vendor_contracts(tenant_id);
CREATE INDEX idx_vendor_contracts_vendor_id ON public.vendor_contracts(vendor_id);
CREATE INDEX idx_vendor_contracts_status ON public.vendor_contracts(status);
CREATE INDEX idx_vendor_contracts_expiry_date ON public.vendor_contracts(expiry_date);
CREATE INDEX idx_vendor_contracts_contract_type ON public.vendor_contracts(contract_type);

-- RLS Policies
ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_contracts_tenant_isolation" ON public.vendor_contracts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ========================================
-- Table: vendor_security_questionnaires
-- Purpose: Security questionnaires for vendor assessments
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendor_security_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.vendor_risk_assessments(id) ON DELETE SET NULL,
  
  -- Questionnaire Details
  questionnaire_code VARCHAR(50) NOT NULL,
  questionnaire_type VARCHAR(50) NOT NULL, -- 'iso27001', 'nca_ecc', 'pdpl', 'soc2', 'custom'
  
  -- Dates
  sent_date DATE,
  due_date DATE,
  completed_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'in_progress', 'completed', 'reviewed'
  
  -- Questions & Responses (JSONB for flexibility)
  questions JSONB DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '{}'::jsonb,
  
  -- Scoring
  total_questions INTEGER DEFAULT 0,
  answered_questions INTEGER DEFAULT 0,
  compliance_score NUMERIC(5,2),
  
  -- Review
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID NOT NULL,
  
  CONSTRAINT vendor_security_questionnaires_tenant_code_unique UNIQUE (tenant_id, questionnaire_code)
);

-- Indexes
CREATE INDEX idx_vendor_security_questionnaires_tenant_id ON public.vendor_security_questionnaires(tenant_id);
CREATE INDEX idx_vendor_security_questionnaires_vendor_id ON public.vendor_security_questionnaires(vendor_id);
CREATE INDEX idx_vendor_security_questionnaires_status ON public.vendor_security_questionnaires(status);
CREATE INDEX idx_vendor_security_questionnaires_due_date ON public.vendor_security_questionnaires(due_date);

-- RLS Policies
ALTER TABLE public.vendor_security_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_security_questionnaires_tenant_isolation" ON public.vendor_security_questionnaires
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ========================================
-- Table: vendor_compliance_checks
-- Purpose: Periodic compliance checks for vendors
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendor_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Check Details
  check_code VARCHAR(50) NOT NULL,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_type VARCHAR(50) NOT NULL, -- 'certification', 'insurance', 'license', 'registration', 'audit_report'
  
  -- Check Item
  compliance_item_ar TEXT NOT NULL,
  compliance_item_en TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'compliant', 'non_compliant', 'expired', 'not_applicable'
  
  -- Documents
  document_urls TEXT[],
  
  -- Validity
  valid_from DATE,
  valid_to DATE,
  
  -- Review
  checked_by UUID NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT now(),
  
  -- Follow-up
  requires_action BOOLEAN DEFAULT false,
  action_notes TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT vendor_compliance_checks_tenant_code_unique UNIQUE (tenant_id, check_code)
);

-- Indexes
CREATE INDEX idx_vendor_compliance_checks_tenant_id ON public.vendor_compliance_checks(tenant_id);
CREATE INDEX idx_vendor_compliance_checks_vendor_id ON public.vendor_compliance_checks(vendor_id);
CREATE INDEX idx_vendor_compliance_checks_status ON public.vendor_compliance_checks(status);
CREATE INDEX idx_vendor_compliance_checks_valid_to ON public.vendor_compliance_checks(valid_to);
CREATE INDEX idx_vendor_compliance_checks_check_type ON public.vendor_compliance_checks(check_type);

-- RLS Policies
ALTER TABLE public.vendor_compliance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_compliance_checks_tenant_isolation" ON public.vendor_compliance_checks
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ========================================
-- Table: vendor_documents
-- Purpose: Document repository for vendors
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Document Details
  document_code VARCHAR(50) NOT NULL,
  document_name_ar TEXT NOT NULL,
  document_name_en TEXT,
  document_type VARCHAR(50) NOT NULL, -- 'contract', 'certificate', 'insurance', 'license', 'report', 'other'
  
  -- File Info
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_mime_type VARCHAR(100),
  storage_path TEXT NOT NULL,
  
  -- Classification
  classification VARCHAR(20) DEFAULT 'internal', -- 'public', 'internal', 'confidential', 'restricted'
  
  -- Validity
  valid_from DATE,
  valid_to DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'expired', 'replaced'
  
  -- Version Control
  version VARCHAR(20) DEFAULT '1.0',
  replaces_document_id UUID REFERENCES public.vendor_documents(id) ON DELETE SET NULL,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT vendor_documents_tenant_code_unique UNIQUE (tenant_id, document_code)
);

-- Indexes
CREATE INDEX idx_vendor_documents_tenant_id ON public.vendor_documents(tenant_id);
CREATE INDEX idx_vendor_documents_vendor_id ON public.vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_document_type ON public.vendor_documents(document_type);
CREATE INDEX idx_vendor_documents_status ON public.vendor_documents(status);
CREATE INDEX idx_vendor_documents_valid_to ON public.vendor_documents(valid_to);

-- RLS Policies
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_documents_tenant_isolation" ON public.vendor_documents
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ========================================
-- Triggers: Auto-update updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_vendor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_vendor_updated_at();

CREATE TRIGGER trigger_vendor_contacts_updated_at
  BEFORE UPDATE ON public.vendor_contacts
  FOR EACH ROW EXECUTE FUNCTION update_vendor_updated_at();

CREATE TRIGGER trigger_vendor_risk_assessments_updated_at
  BEFORE UPDATE ON public.vendor_risk_assessments
  FOR EACH ROW EXECUTE FUNCTION update_vendor_updated_at();

CREATE TRIGGER trigger_vendor_contracts_updated_at
  BEFORE UPDATE ON public.vendor_contracts
  FOR EACH ROW EXECUTE FUNCTION update_vendor_updated_at();

CREATE TRIGGER trigger_vendor_security_questionnaires_updated_at
  BEFORE UPDATE ON public.vendor_security_questionnaires
  FOR EACH ROW EXECUTE FUNCTION update_vendor_updated_at();

CREATE TRIGGER trigger_vendor_documents_updated_at
  BEFORE UPDATE ON public.vendor_documents
  FOR EACH ROW EXECUTE FUNCTION update_vendor_updated_at();

-- ========================================
-- RLS Documentation
-- ========================================
INSERT INTO public._gate_g_rls_intentions (table_name, policy_intent, rbac_roles, notes)
VALUES 
  ('vendors', 'Tenant isolation: Users can only access vendors in their tenant', 'tenant_admin,manager,employee', 'All vendor data is tenant-scoped'),
  ('vendor_contacts', 'Tenant isolation: Users can only access contacts in their tenant', 'tenant_admin,manager,employee', 'Contact data follows vendor tenant scope'),
  ('vendor_risk_assessments', 'Tenant isolation: Users can only access assessments in their tenant', 'tenant_admin,manager', 'Risk assessments are tenant-scoped'),
  ('vendor_contracts', 'Tenant isolation: Users can only access contracts in their tenant', 'tenant_admin,manager', 'Contract data is confidential and tenant-scoped'),
  ('vendor_security_questionnaires', 'Tenant isolation: Users can only access questionnaires in their tenant', 'tenant_admin,manager', 'Questionnaire data is tenant-scoped'),
  ('vendor_compliance_checks', 'Tenant isolation: Users can only access compliance checks in their tenant', 'tenant_admin,manager', 'Compliance data is tenant-scoped'),
  ('vendor_documents', 'Tenant isolation: Users can only access documents in their tenant', 'tenant_admin,manager,employee', 'Document access follows vendor permissions')
ON CONFLICT (table_name) DO NOTHING;