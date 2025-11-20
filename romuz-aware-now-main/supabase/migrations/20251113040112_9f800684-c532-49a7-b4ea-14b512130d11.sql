-- Part 1: Add Advanced Tenant Settings to admin_settings table
-- Storage Limits
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 5120, -- 5 GB default
ADD COLUMN IF NOT EXISTS storage_used_mb INTEGER DEFAULT 0;

-- API Rate Limits
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS api_rate_limit_per_minute INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS api_rate_limit_per_hour INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS api_unlimited BOOLEAN DEFAULT false;

-- Email Quotas
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS email_quota_monthly INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS email_used_current_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_quota_reset_date DATE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month');

-- Custom Branding
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS branding_logo_url TEXT,
ADD COLUMN IF NOT EXISTS branding_primary_color TEXT DEFAULT 'hsl(222.2 47.4% 11.2%)', -- Default from design system
ADD COLUMN IF NOT EXISTS branding_secondary_color TEXT DEFAULT 'hsl(210 40% 96.1%)',
ADD COLUMN IF NOT EXISTS branding_app_name TEXT DEFAULT 'Romuz Awareness',
ADD COLUMN IF NOT EXISTS branding_support_email TEXT,
ADD COLUMN IF NOT EXISTS branding_support_phone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN admin_settings.storage_limit_mb IS 'Maximum storage allowed in MB for this tenant';
COMMENT ON COLUMN admin_settings.storage_used_mb IS 'Current storage used in MB by this tenant';
COMMENT ON COLUMN admin_settings.api_rate_limit_per_minute IS 'API requests allowed per minute';
COMMENT ON COLUMN admin_settings.api_rate_limit_per_hour IS 'API requests allowed per hour';
COMMENT ON COLUMN admin_settings.api_unlimited IS 'Whether tenant has unlimited API access';
COMMENT ON COLUMN admin_settings.email_quota_monthly IS 'Monthly email sending quota';
COMMENT ON COLUMN admin_settings.email_used_current_month IS 'Emails sent in current month';
COMMENT ON COLUMN admin_settings.email_quota_reset_date IS 'Date when email quota resets';
COMMENT ON COLUMN admin_settings.branding_logo_url IS 'Custom logo URL for tenant branding';
COMMENT ON COLUMN admin_settings.branding_primary_color IS 'Primary brand color in HSL format';
COMMENT ON COLUMN admin_settings.branding_secondary_color IS 'Secondary brand color in HSL format';
COMMENT ON COLUMN admin_settings.branding_app_name IS 'Custom application name for tenant';
COMMENT ON COLUMN admin_settings.branding_support_email IS 'Support contact email';
COMMENT ON COLUMN admin_settings.branding_support_phone IS 'Support contact phone';

-- Create index for performance on tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_tenant_id ON admin_settings(tenant_id);