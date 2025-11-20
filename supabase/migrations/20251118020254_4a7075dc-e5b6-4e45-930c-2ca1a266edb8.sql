-- Part 1: Add app_code to documents table for multi-app repository support
-- Gate-D3: Documents Module Enhancement

-- Add app_code column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS app_code TEXT;

-- Add comment
COMMENT ON COLUMN public.documents.app_code IS 'Application code: admin, awareness, compliance, risks, audits, committees. NULL = shared/admin';

-- Create index for performance (tenant_id, app_code)
CREATE INDEX IF NOT EXISTS idx_documents_tenant_app 
ON public.documents(tenant_id, app_code) 
WHERE app_code IS NOT NULL;

-- Create index for app_code filtering
CREATE INDEX IF NOT EXISTS idx_documents_app_code 
ON public.documents(app_code) 
WHERE app_code IS NOT NULL;

-- Add check constraint for valid app codes
ALTER TABLE public.documents 
ADD CONSTRAINT chk_documents_app_code 
CHECK (app_code IS NULL OR app_code IN ('admin', 'awareness', 'compliance', 'risks', 'audits', 'committees'));

-- Update existing documents to have 'admin' as default app_code (optional - can be NULL for shared)
-- This is commented out to keep existing documents as shared/central
-- UPDATE public.documents SET app_code = 'admin' WHERE app_code IS NULL;