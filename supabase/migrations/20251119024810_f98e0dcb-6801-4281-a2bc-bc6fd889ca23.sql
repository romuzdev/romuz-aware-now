-- ============================================================================
-- M10: Add app_code support to Workflow Rules
-- ============================================================================

-- Add app_code column to document_workflow_rules
ALTER TABLE public.document_workflow_rules 
ADD COLUMN IF NOT EXISTS app_code TEXT;

-- Add comment
COMMENT ON COLUMN public.document_workflow_rules.app_code IS 'Application code to scope rules (audits, awareness, committees, etc.)';

-- Create index for app_code filtering
CREATE INDEX IF NOT EXISTS idx_workflow_rules_app_code 
ON public.document_workflow_rules(tenant_id, app_code) 
WHERE app_code IS NOT NULL;

-- Update unique constraint to include app_code
ALTER TABLE public.document_workflow_rules 
DROP CONSTRAINT IF EXISTS unique_tenant_rule_name;

ALTER TABLE public.document_workflow_rules 
ADD CONSTRAINT unique_tenant_app_rule_name 
UNIQUE (tenant_id, app_code, rule_name);