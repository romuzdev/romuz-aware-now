-- Fix RLS policies for Risk Management tables

-- 1. Create function to get user's tenant_id (if not exists)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT tenant_id
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- 2. Drop and recreate vendors policies
DROP POLICY IF EXISTS "vendors_insert" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete" ON public.vendors;
DROP POLICY IF EXISTS "vendors_tenant_isolation" ON public.vendors;

CREATE POLICY "vendors_select_by_tenant"
  ON public.vendors FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "vendors_insert_by_tenant"
  ON public.vendors FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "vendors_update_by_tenant"
  ON public.vendors FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    updated_by = auth.uid()
  );

CREATE POLICY "vendors_delete_by_tenant"
  ON public.vendors FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- 3. Fix vendor_risk_assessments policies
DROP POLICY IF EXISTS "vendor_risk_assessments_tenant_isolation" ON public.vendor_risk_assessments;

CREATE POLICY "assessments_select_by_tenant"
  ON public.vendor_risk_assessments FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "assessments_insert_by_tenant"
  ON public.vendor_risk_assessments FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "assessments_update_by_tenant"
  ON public.vendor_risk_assessments FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "assessments_delete_by_tenant"
  ON public.vendor_risk_assessments FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- 4. Fix vendor_contracts policies
DROP POLICY IF EXISTS "vendor_contracts_tenant_isolation" ON public.vendor_contracts;

CREATE POLICY "contracts_select_by_tenant"
  ON public.vendor_contracts FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "contracts_insert_by_tenant"
  ON public.vendor_contracts FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "contracts_update_by_tenant"
  ON public.vendor_contracts FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "contracts_delete_by_tenant"
  ON public.vendor_contracts FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());