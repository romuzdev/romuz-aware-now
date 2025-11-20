
-- Gate-P Hotfix: Add status column to tenants table
-- Migrates data from is_active (boolean) to status (text)
-- =========================================================

-- Step 1: Add status column (nullable initially)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS status TEXT;

-- Step 2: Create a CHECK constraint for valid status values
ALTER TABLE public.tenants
DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE public.tenants
ADD CONSTRAINT tenants_status_check 
CHECK (status IN ('CREATED', 'PROVISIONING', 'ACTIVE', 'SUSPENDED', 'READ_ONLY', 'DEPROVISIONING', 'ARCHIVED'));

-- Step 3: Migrate existing data
-- is_active = true → status = 'ACTIVE'
-- is_active = false → status = 'SUSPENDED'
UPDATE public.tenants
SET status = CASE 
  WHEN is_active = true THEN 'ACTIVE'
  WHEN is_active = false THEN 'SUSPENDED'
  ELSE 'ACTIVE' -- Default fallback
END
WHERE status IS NULL;

-- Step 4: Make status NOT NULL
ALTER TABLE public.tenants
ALTER COLUMN status SET NOT NULL;

-- Step 5: Set default value for new records
ALTER TABLE public.tenants
ALTER COLUMN status SET DEFAULT 'CREATED';

-- Step 6: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tenants_status 
ON public.tenants(status);

-- Step 7: Add comment
COMMENT ON COLUMN public.tenants.status IS 
'Tenant lifecycle state: CREATED, PROVISIONING, ACTIVE, SUSPENDED, READ_ONLY, DEPROVISIONING, ARCHIVED';

-- Note: is_active column is kept for backward compatibility
-- It can be removed in a future migration if needed
