-- =====================================================
-- Core Infrastructure Tables
-- Gate-K: Shared Infrastructure for D1 Standard
-- =====================================================

-- 1. Bulk Operation Logs Table
-- Tracks all bulk operations across modules
CREATE TABLE IF NOT EXISTS public.bulk_operation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  module_name TEXT NOT NULL, -- 'campaigns', 'policies', 'documents', 'committees'
  operation_type TEXT NOT NULL, -- 'delete', 'update', 'export', 'import', 'archive'
  entity_type TEXT NOT NULL, -- 'campaign', 'policy', 'document', 'committee', etc.
  affected_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for bulk_operation_logs
CREATE INDEX idx_bulk_logs_tenant_id ON public.bulk_operation_logs(tenant_id);
CREATE INDEX idx_bulk_logs_user_id ON public.bulk_operation_logs(user_id);
CREATE INDEX idx_bulk_logs_module_name ON public.bulk_operation_logs(module_name);
CREATE INDEX idx_bulk_logs_status ON public.bulk_operation_logs(status);
CREATE INDEX idx_bulk_logs_created_at ON public.bulk_operation_logs(created_at DESC);

-- RLS for bulk_operation_logs
ALTER TABLE public.bulk_operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bulk logs in their tenant"
  ON public.bulk_operation_logs
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create bulk logs in their tenant"
  ON public.bulk_operation_logs
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their bulk logs"
  ON public.bulk_operation_logs
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- 2. Import/Export Jobs Table
-- Tracks import/export operations
CREATE TABLE IF NOT EXISTS public.import_export_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  module_name TEXT NOT NULL, -- 'campaigns', 'policies', 'documents', 'committees'
  job_type TEXT NOT NULL, -- 'import', 'export'
  entity_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  file_format TEXT NOT NULL DEFAULT 'csv', -- 'csv', 'json', 'xlsx'
  file_path TEXT, -- Storage path for the file
  file_size_bytes BIGINT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  options JSONB DEFAULT '{}'::jsonb, -- Import/export options
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for import_export_jobs
CREATE INDEX idx_import_export_tenant_id ON public.import_export_jobs(tenant_id);
CREATE INDEX idx_import_export_user_id ON public.import_export_jobs(user_id);
CREATE INDEX idx_import_export_module_name ON public.import_export_jobs(module_name);
CREATE INDEX idx_import_export_job_type ON public.import_export_jobs(job_type);
CREATE INDEX idx_import_export_status ON public.import_export_jobs(status);
CREATE INDEX idx_import_export_created_at ON public.import_export_jobs(created_at DESC);

-- RLS for import_export_jobs
ALTER TABLE public.import_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view import/export jobs in their tenant"
  ON public.import_export_jobs
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create import/export jobs in their tenant"
  ON public.import_export_jobs
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their import/export jobs"
  ON public.import_export_jobs
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- 3. Saved Views Table (if not exists - checking current state)
-- This may already exist based on the context provided
CREATE TABLE IF NOT EXISTS public.saved_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  page_key TEXT NOT NULL, -- 'campaigns:list', 'policies:list', etc.
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_saved_view_per_user UNIQUE(tenant_id, user_id, page_key, name)
);

-- Indexes for saved_views
CREATE INDEX IF NOT EXISTS idx_saved_views_tenant_id ON public.saved_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_user_id ON public.saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_page_key ON public.saved_views(page_key);
CREATE INDEX IF NOT EXISTS idx_saved_views_is_default ON public.saved_views(is_default);

-- RLS for saved_views (if not exists)
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their saved views" ON public.saved_views;
CREATE POLICY "Users can view their saved views"
  ON public.saved_views
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create their saved views" ON public.saved_views;
CREATE POLICY "Users can create their saved views"
  ON public.saved_views
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their saved views" ON public.saved_views;
CREATE POLICY "Users can update their saved views"
  ON public.saved_views
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their saved views" ON public.saved_views;
CREATE POLICY "Users can delete their saved views"
  ON public.saved_views
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bulk_operation_logs_updated_at ON public.bulk_operation_logs;
CREATE TRIGGER update_bulk_operation_logs_updated_at
  BEFORE UPDATE ON public.bulk_operation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_import_export_jobs_updated_at ON public.import_export_jobs;
CREATE TRIGGER update_import_export_jobs_updated_at
  BEFORE UPDATE ON public.import_export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_views_updated_at ON public.saved_views;
CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.bulk_operation_logs IS 'Gate-K: Tracks all bulk operations across modules (D1 Standard)';
COMMENT ON TABLE public.import_export_jobs IS 'Gate-K: Tracks import/export operations across modules (D1 Standard)';
COMMENT ON TABLE public.saved_views IS 'Gate-K: User saved views/filters for all list pages (D1 Standard)';