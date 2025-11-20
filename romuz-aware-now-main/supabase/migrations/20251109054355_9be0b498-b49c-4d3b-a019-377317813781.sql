-- Part 11.1: Campaign Content & Module Progress Tables
-- Multi-tenant content delivery system

-- Create campaign_modules table
CREATE TABLE public.campaign_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.awareness_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url_or_ref TEXT NULL,
  content TEXT NULL,
  position INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  estimated_minutes INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint on position per campaign
CREATE UNIQUE INDEX idx_modules_unique_position 
ON public.campaign_modules (tenant_id, campaign_id, position);

-- Add performance index
CREATE INDEX idx_modules_campaign 
ON public.campaign_modules (tenant_id, campaign_id);

-- Enable Row Level Security
ALTER TABLE public.campaign_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT
CREATE POLICY "Users can view modules in their tenant"
ON public.campaign_modules
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: INSERT
CREATE POLICY "Users can create modules in their tenant"
ON public.campaign_modules
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- RLS Policy: UPDATE
CREATE POLICY "Users can update modules in their tenant"
ON public.campaign_modules
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: DELETE
CREATE POLICY "Users can delete modules in their tenant"
ON public.campaign_modules
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_modules_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to table
CREATE TRIGGER update_campaign_modules_updated_at
BEFORE UPDATE ON public.campaign_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_modules_updated_at();

-- Create module_progress table
CREATE TABLE public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.awareness_campaigns(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.campaign_modules(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.campaign_participants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  last_visit_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint on participant + module
CREATE UNIQUE INDEX idx_progress_unique_participant_module 
ON public.module_progress (tenant_id, participant_id, module_id);

-- Add performance indexes
CREATE INDEX idx_progress_participant 
ON public.module_progress (tenant_id, participant_id);

CREATE INDEX idx_progress_module 
ON public.module_progress (tenant_id, module_id);

CREATE INDEX idx_progress_campaign 
ON public.module_progress (tenant_id, campaign_id);

-- Enable Row Level Security
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT
CREATE POLICY "Users can view progress in their tenant"
ON public.module_progress
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: INSERT
CREATE POLICY "Users can create progress in their tenant"
ON public.module_progress
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- RLS Policy: UPDATE
CREATE POLICY "Users can update progress in their tenant"
ON public.module_progress
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: DELETE
CREATE POLICY "Users can delete progress in their tenant"
ON public.module_progress
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_module_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to table
CREATE TRIGGER update_module_progress_updated_at
BEFORE UPDATE ON public.module_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_module_progress_updated_at();