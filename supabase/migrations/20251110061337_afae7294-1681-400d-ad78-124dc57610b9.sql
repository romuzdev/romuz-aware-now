-- ============================================================================
-- Gate-E Closeout: Feature Flags Table
-- ============================================================================

-- Create feature_flags table for per-tenant rollout control
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT unique_tenant_flag UNIQUE(tenant_id, flag_key)
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags
CREATE POLICY "Users can view flags for their tenant"
  ON public.feature_flags
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can insert flags in their tenant"
  ON public.feature_flags
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update flags in their tenant"
  ON public.feature_flags
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete flags in their tenant"
  ON public.feature_flags
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create index for fast flag lookups
CREATE INDEX idx_feature_flags_tenant_key ON public.feature_flags(tenant_id, flag_key);

-- Create job_runs table for tracking background jobs (used for export_failure alerts)
CREATE TABLE IF NOT EXISTS public.job_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_runs
CREATE POLICY "Users can view job runs in their tenant"
  ON public.job_runs
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert job runs"
  ON public.job_runs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update job runs"
  ON public.job_runs
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create index for job monitoring
CREATE INDEX idx_job_runs_tenant_status ON public.job_runs(tenant_id, status, started_at DESC);

COMMENT ON TABLE public.feature_flags IS 'Per-tenant feature flag rollout control';
COMMENT ON TABLE public.job_runs IS 'Background job execution tracking for monitoring and alerting';