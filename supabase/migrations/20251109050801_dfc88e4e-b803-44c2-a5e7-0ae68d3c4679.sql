-- Part A: Server-Side Saved Views Table
-- Multi-tenant, per-user, per-page-key scoped saved views with strict RLS.

-- 1. Create saved_views table
CREATE TABLE IF NOT EXISTS public.saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- auth.users.id (no FK, follows best practices)
  page_key TEXT NOT NULL,  -- e.g., 'campaigns:list', 'policies:list'
  name TEXT NOT NULL,      -- Human-friendly name
  filters JSONB NOT NULL,  -- The filters object
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_views_tenant_user_page 
  ON public.saved_views(tenant_id, user_id, page_key, created_at DESC);

-- Optional: Partial index for default views (faster lookups)
CREATE INDEX IF NOT EXISTS idx_saved_views_default 
  ON public.saved_views(tenant_id, user_id, page_key) 
  WHERE is_default = TRUE;

-- 3. Constraints
-- Prevent duplicate names per (tenant, user, page)
ALTER TABLE public.saved_views 
  ADD CONSTRAINT uq_saved_views_tenant_user_page_name 
  UNIQUE (tenant_id, user_id, page_key, name);

-- 4. Trigger for updated_at auto-touch
CREATE OR REPLACE FUNCTION public.update_saved_views_updated_at()
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

CREATE TRIGGER trg_update_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_saved_views_updated_at();

-- 5. Enable RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (strict tenant + user scoping)
-- SELECT: user can read their own views in their tenant
CREATE POLICY "Users can read their own saved views"
  ON public.saved_views
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- INSERT: user can create views in their tenant
CREATE POLICY "Users can create their own saved views"
  ON public.saved_views
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- UPDATE: user can update their own views
CREATE POLICY "Users can update their own saved views"
  ON public.saved_views
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- DELETE: user can delete their own views
CREATE POLICY "Users can delete their own saved views"
  ON public.saved_views
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- Add comment for documentation
COMMENT ON TABLE public.saved_views IS 'Multi-tenant saved views for list pages (campaigns, policies, etc.). Each view stores filters as JSONB and is scoped to tenant + user + page_key.';
