-- Create policies table for M23 Policies Management
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT,
  last_review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique policy codes per tenant
  CONSTRAINT unique_policy_code_per_tenant UNIQUE (tenant_id, code)
);

-- Create index for faster queries
CREATE INDEX idx_policies_tenant_id ON public.policies(tenant_id);
CREATE INDEX idx_policies_status ON public.policies(status);
CREATE INDEX idx_policies_next_review ON public.policies(next_review_date);

-- Enable Row Level Security
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view policies in their tenant
CREATE POLICY "Users can view policies in their tenant"
ON public.policies
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: Users can insert policies in their tenant
CREATE POLICY "Users can insert policies in their tenant"
ON public.policies
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND auth.uid() IS NOT NULL
);

-- RLS Policy: Users can update policies in their tenant
CREATE POLICY "Users can update policies in their tenant"
ON public.policies
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- RLS Policy: Users can delete policies in their tenant
CREATE POLICY "Users can delete policies in their tenant"
ON public.policies
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_policies_updated_at()
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

CREATE TRIGGER trigger_policies_updated_at
BEFORE UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.update_policies_updated_at();