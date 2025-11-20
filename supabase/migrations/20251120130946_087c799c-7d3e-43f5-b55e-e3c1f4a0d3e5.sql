-- ============================================================================
-- M16: AI Advisory Engine - Database Schema
-- Purpose: AI-powered recommendations and insights for GRC/Awareness modules
-- ============================================================================

-- Table: ai_recommendations
-- Stores AI-generated recommendations with confidence scoring and feedback
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Context Information
  context_type TEXT NOT NULL CHECK (context_type IN (
    'risk', 'compliance', 'audit', 'campaign', 'policy', 
    'action_plan', 'incident', 'security_event'
  )),
  context_id UUID NOT NULL, -- ID of the related entity
  context_snapshot JSONB, -- Snapshot of context data used for recommendation
  
  -- Recommendation Content (Bilingual)
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  rationale_ar TEXT, -- Why this recommendation
  rationale_en TEXT,
  
  -- AI Metadata
  model_used TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  category TEXT, -- e.g., 'risk_mitigation', 'compliance_improvement', 'efficiency'
  
  -- Processing
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'implemented', 'expired'
  )),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Recommendations can expire
  
  -- User Feedback
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  feedback_at TIMESTAMP WITH TIME ZONE,
  feedback_by UUID,
  
  -- Action Tracking
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  implemented_at TIMESTAMP WITH TIME ZONE,
  implemented_by UUID,
  implementation_notes TEXT,
  
  -- Metadata
  tags TEXT[],
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_ai_recommendations_tenant
    FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) 
    ON DELETE RESTRICT
);

-- Table: ai_decision_logs
-- Tracks all AI decisions and actions for audit purposes
CREATE TABLE IF NOT EXISTS public.ai_decision_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Decision Context
  recommendation_id UUID,
  context_type TEXT NOT NULL,
  context_id UUID,
  
  -- Decision Details
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'recommendation_generated', 'recommendation_accepted', 'recommendation_rejected',
    'recommendation_implemented', 'feedback_provided', 'recommendation_expired'
  )),
  decision_maker UUID, -- User who made the decision (null for system)
  
  -- AI Details
  model_used TEXT,
  prompt_used TEXT, -- Store the prompt for transparency
  response_received TEXT,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  
  -- Decision Outcome
  outcome TEXT, -- Success, Error, etc.
  outcome_details JSONB,
  error_message TEXT,
  
  -- Timestamps
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_ai_decision_logs_tenant
    FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) 
    ON DELETE RESTRICT,
  CONSTRAINT fk_ai_decision_logs_recommendation
    FOREIGN KEY (recommendation_id)
    REFERENCES public.ai_recommendations(id)
    ON DELETE SET NULL
);

-- Indexes for Performance
CREATE INDEX idx_ai_recommendations_tenant_context 
  ON public.ai_recommendations(tenant_id, context_type, context_id);

CREATE INDEX idx_ai_recommendations_status 
  ON public.ai_recommendations(tenant_id, status);

CREATE INDEX idx_ai_recommendations_priority 
  ON public.ai_recommendations(tenant_id, priority, status);

CREATE INDEX idx_ai_recommendations_expires_at 
  ON public.ai_recommendations(expires_at) 
  WHERE expires_at IS NOT NULL AND status = 'pending';

CREATE INDEX idx_ai_decision_logs_tenant 
  ON public.ai_decision_logs(tenant_id, decided_at DESC);

CREATE INDEX idx_ai_decision_logs_recommendation 
  ON public.ai_decision_logs(recommendation_id);

-- Enable Row Level Security
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_recommendations
CREATE POLICY "Users can view recommendations in their tenant"
  ON public.ai_recommendations
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert recommendations"
  ON public.ai_recommendations
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recommendations in their tenant"
  ON public.ai_recommendations
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_decision_logs
CREATE POLICY "Users can view decision logs in their tenant"
  ON public.ai_decision_logs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert decision logs"
  ON public.ai_decision_logs
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger: Update updated_at on ai_recommendations
CREATE OR REPLACE FUNCTION public.update_ai_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_ai_recommendations_updated_at
  BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_recommendations_updated_at();

-- Function: Auto-expire old pending recommendations
CREATE OR REPLACE FUNCTION public.expire_old_recommendations()
RETURNS void AS $$
BEGIN
  UPDATE public.ai_recommendations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comment tables for documentation
COMMENT ON TABLE public.ai_recommendations IS 'M16: Stores AI-generated recommendations with confidence scoring and user feedback';
COMMENT ON TABLE public.ai_decision_logs IS 'M16: Audit log for all AI decisions and actions';

COMMENT ON COLUMN public.ai_recommendations.confidence_score IS 'AI confidence level (0.0 to 1.0)';
COMMENT ON COLUMN public.ai_recommendations.expires_at IS 'Recommendations expire after 7 days by default';
COMMENT ON COLUMN public.ai_decision_logs.tokens_used IS 'Number of tokens consumed by AI model';
COMMENT ON COLUMN public.ai_decision_logs.prompt_used IS 'Full prompt sent to AI for transparency';