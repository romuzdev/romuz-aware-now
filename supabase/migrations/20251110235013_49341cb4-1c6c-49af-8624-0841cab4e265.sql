-- Gate-I Part 2A: Create campaign_feedback table as per specifications
-- This table tracks participant feedback separately for better analytics normalization

CREATE TABLE IF NOT EXISTS public.campaign_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  participant_id UUID NULL, -- Optional but preferred per specs
  score NUMERIC CHECK (score >= 1 AND score <= 5),
  comment TEXT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for analytics performance
CREATE INDEX idx_campaign_feedback_tenant_campaign 
  ON public.campaign_feedback (tenant_id, campaign_id);

CREATE INDEX idx_campaign_feedback_tenant_submitted 
  ON public.campaign_feedback (tenant_id, submitted_at);

CREATE INDEX idx_campaign_feedback_participant 
  ON public.campaign_feedback (tenant_id, participant_id) 
  WHERE participant_id IS NOT NULL;

CREATE INDEX idx_campaign_feedback_score 
  ON public.campaign_feedback (tenant_id, campaign_id, score) 
  WHERE score IS NOT NULL;

-- RLS Policies for multi-tenant isolation
ALTER TABLE public.campaign_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback in their tenant"
  ON public.campaign_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Users can view feedback in their tenant"
  ON public.campaign_feedback
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update feedback in their tenant"
  ON public.campaign_feedback
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete feedback in their tenant"
  ON public.campaign_feedback
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_campaign_feedback_updated_at_trigger
  BEFORE UPDATE ON public.campaign_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_feedback_updated_at();

-- Add helpful comment
COMMENT ON TABLE public.campaign_feedback IS 'Stores participant feedback for awareness campaigns - normalized separately for analytics';
COMMENT ON COLUMN public.campaign_feedback.score IS 'Feedback score 1-5 scale';
COMMENT ON COLUMN public.campaign_feedback.comment IS 'Optional textual feedback from participant';