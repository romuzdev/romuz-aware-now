/**
 * M22 - Admin Console Enhancement Integration
 * 
 * Provides functions for admin settings, branding, maintenance mode, and system configurations
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface AdminSettings {
  id: string;
  tenant_id: string;
  branding_app_name: string | null;
  branding_logo_url: string | null;
  branding_primary_color: string | null;
  branding_secondary_color: string | null;
  branding_support_email: string | null;
  branding_support_phone: string | null;
  custom_css: string | null;
  custom_js: string | null;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  allowed_domains: string[] | null;
  blocked_ips: string[] | null;
  security_headers: Record<string, any>;
  backup_settings: Record<string, any>;
  password_min_length: number | null;
  password_require_uppercase: boolean | null;
  password_require_lowercase: boolean | null;
  password_require_numbers: boolean | null;
  password_require_special_chars: boolean | null;
  session_timeout_minutes: number | null;
  session_absolute_timeout_minutes: number | null;
  mfa_required: boolean | null;
  mfa_methods: Record<string, any> | null;
  api_rate_limit_per_minute: number | null;
  api_rate_limit_per_hour: number | null;
  max_file_upload_size_mb: number | null;
  storage_limit_mb: number | null;
  storage_used_mb: number | null;
  feature_flags: Record<string, any>;
  notification_channels: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SystemConfiguration {
  id: string;
  tenant_id: string;
  config_key: string;
  config_value: any;
  config_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: 'security' | 'performance' | 'ui' | 'integration' | 'notification';
  description: string | null;
  is_sensitive: boolean;
  is_readonly: boolean;
  validation_rules: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface BrandingSettings {
  app_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  support_email: string;
  support_phone: string;
  custom_css?: string;
}

export interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special_chars: boolean;
  session_timeout_minutes: number;
  session_absolute_timeout_minutes: number;
  mfa_required: boolean;
  mfa_methods: Record<string, any>;
  allowed_domains: string[];
  blocked_ips: string[];
  security_headers: Record<string, any>;
}

// ============================================================================
// Admin Settings Functions
// ============================================================================

/**
 * Fetch admin settings for current tenant
 */
export async function fetchAdminSettings(tenantId: string): Promise<AdminSettings | null> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return null
      return null;
    }
    console.error('Error fetching admin settings:', error);
    throw error;
  }

  return data;
}

/**
 * Update branding settings
 */
export async function updateBrandingSettings(
  tenantId: string,
  branding: Partial<BrandingSettings>
): Promise<AdminSettings> {
  const { data: { user } } = await supabase.auth.getUser();

  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: user?.id,
  };

  if (branding.app_name) updateData.branding_app_name = branding.app_name;
  if (branding.logo_url) updateData.branding_logo_url = branding.logo_url;
  if (branding.primary_color) updateData.branding_primary_color = branding.primary_color;
  if (branding.secondary_color) updateData.branding_secondary_color = branding.secondary_color;
  if (branding.support_email) updateData.branding_support_email = branding.support_email;
  if (branding.support_phone) updateData.branding_support_phone = branding.support_phone;
  if (branding.custom_css !== undefined) updateData.custom_css = branding.custom_css;

  const { data, error } = await supabase
    .from('admin_settings')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating branding settings:', error);
    throw error;
  }

  return data;
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(
  tenantId: string,
  security: Partial<SecuritySettings>
): Promise<AdminSettings> {
  const { data: { user } } = await supabase.auth.getUser();

  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: user?.id,
    ...security,
  };

  const { data, error } = await supabase
    .from('admin_settings')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating security settings:', error);
    throw error;
  }

  return data;
}

/**
 * Enable or disable maintenance mode
 */
export async function setMaintenanceMode(
  tenantId: string,
  enabled: boolean,
  message?: string
): Promise<AdminSettings> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('admin_settings')
    .update({
      maintenance_mode: enabled,
      maintenance_message: message || null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    })
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error setting maintenance mode:', error);
    throw error;
  }

  return data;
}

/**
 * Update feature flags
 */
export async function updateFeatureFlags(
  tenantId: string,
  featureFlags: Record<string, boolean>
): Promise<AdminSettings> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('admin_settings')
    .update({
      feature_flags: featureFlags,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    })
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating feature flags:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// System Configurations Functions
// ============================================================================

/**
 * Fetch all system configurations for tenant
 */
export async function fetchSystemConfigurations(params: {
  tenantId: string;
  category?: string;
  excludeSensitive?: boolean;
}): Promise<SystemConfiguration[]> {
  let query = supabase
    .from('system_configurations')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .order('category')
    .order('config_key');

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.excludeSensitive) {
    query = query.eq('is_sensitive', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching system configurations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a specific configuration value
 */
export async function getConfigurationValue(
  tenantId: string,
  configKey: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('system_configurations')
    .select('config_value')
    .eq('tenant_id', tenantId)
    .eq('config_key', configKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching configuration value:', error);
    throw error;
  }

  return data.config_value;
}

/**
 * Set a configuration value
 */
export async function setConfigurationValue(
  tenantId: string,
  configKey: string,
  configValue: any,
  options?: {
    configType?: SystemConfiguration['config_type'];
    category?: SystemConfiguration['category'];
    description?: string;
    isSensitive?: boolean;
    isReadonly?: boolean;
  }
): Promise<SystemConfiguration> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('system_configurations')
    .upsert({
      tenant_id: tenantId,
      config_key: configKey,
      config_value: configValue,
      config_type: options?.configType || 'string',
      category: options?.category || 'ui',
      description: options?.description,
      is_sensitive: options?.isSensitive || false,
      is_readonly: options?.isReadonly || false,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    }, {
      onConflict: 'tenant_id,config_key',
    })
    .select()
    .single();

  if (error) {
    console.error('Error setting configuration value:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a configuration
 */
export async function deleteConfiguration(
  tenantId: string,
  configKey: string
): Promise<void> {
  const { error } = await supabase
    .from('system_configurations')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('config_key', configKey);

  if (error) {
    console.error('Error deleting configuration:', error);
    throw error;
  }
}

/**
 * Bulk update configurations
 */
export async function bulkUpdateConfigurations(
  tenantId: string,
  configurations: Array<{ key: string; value: any }>
): Promise<SystemConfiguration[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const updates = configurations.map(config => ({
    tenant_id: tenantId,
    config_key: config.key,
    config_value: config.value,
    config_type: 'json' as const,
    category: 'ui' as const,
    updated_at: new Date().toISOString(),
    updated_by: user?.id,
  }));

  const { data, error } = await supabase
    .from('system_configurations')
    .upsert(updates, {
      onConflict: 'tenant_id,config_key',
    })
    .select();

  if (error) {
    console.error('Error bulk updating configurations:', error);
    throw error;
  }

  return data || [];
}
