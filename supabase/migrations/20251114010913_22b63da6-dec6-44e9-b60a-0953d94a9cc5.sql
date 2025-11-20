-- Step 1: Add tenant_id column
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS tenant_id UUID NULL;