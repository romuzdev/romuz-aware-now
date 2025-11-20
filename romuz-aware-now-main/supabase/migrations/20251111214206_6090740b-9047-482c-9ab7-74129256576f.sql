-- Add missing created_by and updated_by columns to admin_settings table
-- These columns are required by fn_gate_n_get_admin_settings and fn_gate_n_upsert_admin_settings

ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.admin_settings.created_by IS 'User who created this settings record';
COMMENT ON COLUMN public.admin_settings.updated_by IS 'User who last updated this settings record';

-- Update existing records to set created_by and updated_by (optional)
-- Set to NULL for existing records since we don't have historical data
UPDATE public.admin_settings
SET created_by = NULL, updated_by = NULL
WHERE created_by IS NULL AND updated_by IS NULL;