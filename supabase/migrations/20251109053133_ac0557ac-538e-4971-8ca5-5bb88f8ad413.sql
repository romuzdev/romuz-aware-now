-- Part 10.1: Campaign Participants Table
-- Multi-tenant engagement tracking for awareness campaigns

-- Create campaign_participants table
CREATE TABLE public.campaign_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.awareness_campaigns(id) ON DELETE CASCADE,
  employee_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  score NUMERIC(5,2) NULL,
  completed_at TIMESTAMPTZ NULL,
  notes TEXT NULL,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint (active records only)
CREATE UNIQUE INDEX idx_cp_unique_active 
ON public.campaign_participants (tenant_id, campaign_id, employee_ref) 
WHERE deleted_at IS NULL;

-- Add performance indexes
CREATE INDEX idx_cp_tenant_campaign 
ON public.campaign_participants (tenant_id, campaign_id);

CREATE INDEX idx_cp_employee 
ON public.campaign_participants (tenant_id, employee_ref);

CREATE INDEX idx_cp_status 
ON public.campaign_participants (tenant_id, status);

-- Partial index for completed participants
CREATE INDEX idx_cp_completed 
ON public.campaign_participants (tenant_id, campaign_id, completed_at) 
WHERE completed_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT
CREATE POLICY "Users can view participants in their tenant"
ON public.campaign_participants
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: INSERT
CREATE POLICY "Users can create participants in their tenant"
ON public.campaign_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- RLS Policy: UPDATE
CREATE POLICY "Users can update participants in their tenant"
ON public.campaign_participants
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: DELETE (soft delete via UPDATE preferred)
CREATE POLICY "Users can delete participants in their tenant"
ON public.campaign_participants
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_participants_updated_at()
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
CREATE TRIGGER update_campaign_participants_updated_at
BEFORE UPDATE ON public.campaign_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_participants_updated_at();

-- TODO: Future enhancement - campaign_events table
-- Purpose: Track detailed timeline events per participant (views, clicks, completions)
-- Deferred to Part 11 or later based on analytics requirements