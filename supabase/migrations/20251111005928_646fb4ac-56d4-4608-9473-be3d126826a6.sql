-- Gate-J: Add RLS Policies for Impact Engine Tables
-- Fix security warnings: Enable RLS and add tenant-scoped policies

-- ========================================
-- Enable RLS on Gate-J tables
-- ========================================

ALTER TABLE public.awareness_impact_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awareness_impact_weights ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies for awareness_impact_scores
-- ========================================

CREATE POLICY "Users can view impact scores in their tenant"
  ON public.awareness_impact_scores
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create impact scores in their tenant"
  ON public.awareness_impact_scores
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update impact scores in their tenant"
  ON public.awareness_impact_scores
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete impact scores in their tenant"
  ON public.awareness_impact_scores
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ========================================
-- RLS Policies for awareness_impact_weights
-- ========================================

CREATE POLICY "Users can view weights in their tenant"
  ON public.awareness_impact_weights
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can create weights in their tenant"
  ON public.awareness_impact_weights
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update weights in their tenant"
  ON public.awareness_impact_weights
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete weights in their tenant"
  ON public.awareness_impact_weights
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));