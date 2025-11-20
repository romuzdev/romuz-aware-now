-- Step 2: Add updated_at column
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();