-- Add Security Settings to admin_settings table
COMMENT ON TABLE admin_settings IS 'Tenant-specific configuration including SLA, features, limits, notifications, storage, API, email, branding, and security settings';

-- Password Policy Settings
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS password_min_length integer DEFAULT 8 CHECK (password_min_length >= 6 AND password_min_length <= 128);

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS password_require_uppercase boolean DEFAULT true;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS password_require_lowercase boolean DEFAULT true;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS password_require_numbers boolean DEFAULT true;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS password_require_special_chars boolean DEFAULT true;

COMMENT ON COLUMN admin_settings.password_min_length IS 'Minimum password length (6-128 characters)';
COMMENT ON COLUMN admin_settings.password_require_uppercase IS 'Require at least one uppercase letter';
COMMENT ON COLUMN admin_settings.password_require_lowercase IS 'Require at least one lowercase letter';
COMMENT ON COLUMN admin_settings.password_require_numbers IS 'Require at least one number';
COMMENT ON COLUMN admin_settings.password_require_special_chars IS 'Require at least one special character';

-- MFA Settings
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS mfa_required boolean DEFAULT false;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS mfa_methods jsonb DEFAULT '["totp"]'::jsonb;

COMMENT ON COLUMN admin_settings.mfa_required IS 'Require Multi-Factor Authentication for all users';
COMMENT ON COLUMN admin_settings.mfa_methods IS 'Allowed MFA methods: totp, sms, email';

-- Session Settings
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS session_timeout_minutes integer DEFAULT 480 CHECK (session_timeout_minutes >= 5 AND session_timeout_minutes <= 10080);

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS session_absolute_timeout_minutes integer DEFAULT 1440 CHECK (session_absolute_timeout_minutes >= 60 AND session_absolute_timeout_minutes <= 43200);

COMMENT ON COLUMN admin_settings.session_timeout_minutes IS 'Session inactivity timeout in minutes (5 min - 1 week). Default: 480 (8 hours)';
COMMENT ON COLUMN admin_settings.session_absolute_timeout_minutes IS 'Absolute session timeout in minutes (1 hour - 30 days). Default: 1440 (24 hours)';

-- Login Attempt Settings
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS max_login_attempts integer DEFAULT 5 CHECK (max_login_attempts >= 3 AND max_login_attempts <= 20);

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS login_lockout_duration_minutes integer DEFAULT 30 CHECK (login_lockout_duration_minutes >= 5 AND login_lockout_duration_minutes <= 1440);

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS login_notification_enabled boolean DEFAULT true;

COMMENT ON COLUMN admin_settings.max_login_attempts IS 'Maximum failed login attempts before lockout (3-20)';
COMMENT ON COLUMN admin_settings.login_lockout_duration_minutes IS 'Lockout duration in minutes (5 min - 24 hours)';
COMMENT ON COLUMN admin_settings.login_notification_enabled IS 'Send notification on failed login attempts';

-- IP Whitelisting (Basic)
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS ip_whitelist_enabled boolean DEFAULT false;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS ip_whitelist_ranges jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN admin_settings.ip_whitelist_enabled IS 'Enable IP whitelisting for tenant access';
COMMENT ON COLUMN admin_settings.ip_whitelist_ranges IS 'Array of allowed IP ranges in CIDR notation';

-- Update existing records with default values
UPDATE admin_settings 
SET 
  password_min_length = COALESCE(password_min_length, 8),
  password_require_uppercase = COALESCE(password_require_uppercase, true),
  password_require_lowercase = COALESCE(password_require_lowercase, true),
  password_require_numbers = COALESCE(password_require_numbers, true),
  password_require_special_chars = COALESCE(password_require_special_chars, true),
  mfa_required = COALESCE(mfa_required, false),
  mfa_methods = COALESCE(mfa_methods, '["totp"]'::jsonb),
  session_timeout_minutes = COALESCE(session_timeout_minutes, 480),
  session_absolute_timeout_minutes = COALESCE(session_absolute_timeout_minutes, 1440),
  max_login_attempts = COALESCE(max_login_attempts, 5),
  login_lockout_duration_minutes = COALESCE(login_lockout_duration_minutes, 30),
  login_notification_enabled = COALESCE(login_notification_enabled, true),
  ip_whitelist_enabled = COALESCE(ip_whitelist_enabled, false),
  ip_whitelist_ranges = COALESCE(ip_whitelist_ranges, '[]'::jsonb),
  updated_at = now()
WHERE 
  password_min_length IS NULL 
  OR password_require_uppercase IS NULL 
  OR password_require_lowercase IS NULL 
  OR password_require_numbers IS NULL 
  OR password_require_special_chars IS NULL
  OR mfa_required IS NULL
  OR mfa_methods IS NULL
  OR session_timeout_minutes IS NULL
  OR session_absolute_timeout_minutes IS NULL
  OR max_login_attempts IS NULL
  OR login_lockout_duration_minutes IS NULL
  OR login_notification_enabled IS NULL
  OR ip_whitelist_enabled IS NULL
  OR ip_whitelist_ranges IS NULL;