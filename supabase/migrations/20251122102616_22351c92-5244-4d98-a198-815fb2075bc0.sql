-- GRC Enhancement Phase 1: Database & Security
-- Transaction Logging + Backup Metadata + Performance Indexes

-- Drop existing audit triggers
DROP TRIGGER IF EXISTS policies_audit_trigger ON policies;
DROP TRIGGER IF EXISTS grc_risks_audit_trigger ON grc_risks;
DROP TRIGGER IF EXISTS grc_risk_assessments_audit_trigger ON grc_risk_assessments;
DROP TRIGGER IF EXISTS grc_risk_treatment_plans_audit_trigger ON grc_risk_treatment_plans;
DROP TRIGGER IF EXISTS documents_audit_trigger ON documents;
DROP TRIGGER IF EXISTS grc_audits_audit_trigger ON grc_audits;
DROP TRIGGER IF EXISTS grc_audit_findings_audit_trigger ON grc_audit_findings;
DROP TRIGGER IF EXISTS audit_findings_categories_audit_trigger ON audit_findings_categories;
DROP TRIGGER IF EXISTS audit_workflows_audit_trigger ON audit_workflows;
DROP TRIGGER IF EXISTS committees_audit_trigger ON committees;
DROP TRIGGER IF EXISTS meetings_audit_trigger ON meetings;
DROP TRIGGER IF EXISTS decisions_audit_trigger ON decisions;
DROP TRIGGER IF EXISTS grc_controls_audit_trigger ON grc_controls;
DROP TRIGGER IF EXISTS grc_control_tests_audit_trigger ON grc_control_tests;
DROP TRIGGER IF EXISTS grc_compliance_frameworks_audit_trigger ON grc_compliance_frameworks;
DROP TRIGGER IF EXISTS grc_compliance_requirements_audit_trigger ON grc_compliance_requirements;
DROP TRIGGER IF EXISTS grc_compliance_gaps_audit_trigger ON grc_compliance_gaps;

-- Create Transaction Logging Triggers
CREATE TRIGGER policies_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON policies FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_risks_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_risks FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_risk_assessments_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_risk_assessments FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_risk_treatment_plans_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_risk_treatment_plans FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER documents_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON documents FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_audits_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_audits FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_audit_findings_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_audit_findings FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER audit_findings_categories_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON audit_findings_categories FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER audit_workflows_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON audit_workflows FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER committees_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON committees FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER meetings_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON meetings FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER decisions_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON decisions FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_controls_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_controls FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_control_tests_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_control_tests FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_compliance_frameworks_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_compliance_frameworks FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_compliance_requirements_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_compliance_requirements FOR EACH ROW EXECUTE FUNCTION log_table_changes();
CREATE TRIGGER grc_compliance_gaps_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON grc_compliance_gaps FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Add Backup Metadata columns
ALTER TABLE policies ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_risk_assessments ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_risk_treatment_plans ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_audits ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_audit_findings ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE audit_findings_categories ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE audit_workflows ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_controls ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_control_tests ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_compliance_frameworks ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_compliance_requirements ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE grc_compliance_gaps ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_policies_last_backed_up ON policies(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grc_risks_last_backed_up ON grc_risks(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_last_backed_up ON documents(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grc_audits_last_backed_up ON grc_audits(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_committees_last_backed_up ON committees(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grc_controls_last_backed_up ON grc_controls(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grc_compliance_frameworks_last_backed_up ON grc_compliance_frameworks(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grc_compliance_requirements_last_backed_up ON grc_compliance_requirements(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- Utility Function
CREATE OR REPLACE FUNCTION update_backup_metadata(p_table_name TEXT, p_tenant_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_updated_count INTEGER; v_query TEXT;
BEGIN
  v_query := format('UPDATE %I SET last_backed_up_at = NOW() WHERE tenant_id = $1', p_table_name);
  EXECUTE v_query USING p_tenant_id;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;