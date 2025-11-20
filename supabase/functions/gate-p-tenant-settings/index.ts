// Gate-P Edge Function: gate-p-tenant-settings
// Purpose: GET/PUT tenant settings for Platform Admin
// RBAC: platform_admin only

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SettingsRequest {
  tenant_id: string;
  sla_config?: any;
  feature_flags?: any;
  limits?: any;
  notification_channels?: any;
  // Storage Limits
  storage_limit_mb?: number;
  storage_used_mb?: number;
  // API Rate Limits
  api_rate_limit_per_minute?: number;
  api_rate_limit_per_hour?: number;
  api_unlimited?: boolean;
  // Email Quotas
  email_quota_monthly?: number;
  email_used_current_month?: number;
  email_quota_reset_date?: string;
  // Custom Branding
  branding_logo_url?: string;
  branding_primary_color?: string;
  branding_secondary_color?: string;
  branding_app_name?: string;
  branding_support_email?: string;
  branding_support_phone?: string;
  // Security Settings - Password Policy
  password_min_length?: number;
  password_require_uppercase?: boolean;
  password_require_lowercase?: boolean;
  password_require_numbers?: boolean;
  password_require_special_chars?: boolean;
  // Security Settings - MFA
  mfa_required?: boolean;
  mfa_methods?: any;
  // Security Settings - Session
  session_timeout_minutes?: number;
  session_absolute_timeout_minutes?: number;
  // Security Settings - Login Attempts
  max_login_attempts?: number;
  login_lockout_duration_minutes?: number;
  login_notification_enabled?: boolean;
  // Security Settings - IP Whitelisting
  ip_whitelist_enabled?: boolean;
  ip_whitelist_ranges?: any;
}

interface SettingsResponse {
  success: boolean;
  data?: any;
  message?: string;
  error_code?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept GET and PUT methods
    if (req.method !== 'GET' && req.method !== 'PUT') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed. Use GET or PUT.', error_code: 'METHOD_NOT_ALLOWED' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing Authorization header', error_code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const bearer = authHeader.trim();
    const tokenMatch = bearer.match(/^Bearer\s+(.+)$/i);
    const jwt = tokenMatch ? tokenMatch[1] : bearer;
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication failed', error_code: 'AUTH_FAILED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, 'Method:', req.method);

    // Check role (platform_admin for Gate-P - Platform Console)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'platform_admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('User does not have required role:', roleError);
      return new Response(
        JSON.stringify({ success: false, message: 'Permission denied: requires platform_admin role', error_code: 'PERMISSION_DENIED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User has role:', roleData.role);

    // Handle GET request
    if (req.method === 'GET') {
      // Get tenant_id from query params
      const url = new URL(req.url);
      const tenantId = url.searchParams.get('tenant_id');

      if (!tenantId) {
        return new Response(
          JSON.stringify({ success: false, message: 'Missing tenant_id parameter', error_code: 'MISSING_TENANT_ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching settings for tenant:', tenantId);

      // Get settings directly from admin_settings table
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('admin_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (settingsError) {
        console.error('Failed to get settings:', settingsError);
        return new Response(
          JSON.stringify({ success: false, message: `Failed to get settings: ${settingsError.message}`, error_code: 'DB_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Successfully retrieved settings');

      // Audit log: VIEW_SETTINGS
      try {
        await supabaseAdmin.from('gate_p_audit_log').insert({
          tenant_id: tenantId,
          entity_type: 'admin_settings',
          entity_id: settings?.id || tenantId,
          action: 'tenant_settings.viewed',
          actor_id: user.id,
          payload: {
            action_type: 'VIEW_TENANT_SETTINGS',
            gate_code: 'Gate-P',
          },
        });
      } catch (auditError) {
        console.warn('Failed to log audit entry:', auditError);
      }

      const response: SettingsResponse = {
        success: true,
        data: settings || {
          tenant_id: tenantId,
          sla_config: { reminder_sla_hours: 24, report_sla_days: 7 },
          feature_flags: { enable_gate_k: true, enable_gate_f: true },
          limits: { max_users: 100, max_active_campaigns: 10 },
          notification_channels: { email: true, slack: false },
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle PUT request
    if (req.method === 'PUT') {
      // Parse request body
      let requestBody: SettingsRequest;
      try {
        requestBody = await req.json();
      } catch (parseError) {
        console.error('Invalid JSON body:', parseError);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid JSON body', error_code: 'INVALID_JSON' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!requestBody.tenant_id) {
        return new Response(
          JSON.stringify({ success: false, message: 'Missing tenant_id in body', error_code: 'MISSING_TENANT_ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Updating settings for tenant:', requestBody.tenant_id);

      // Upsert settings
      const upsertData: any = {
        tenant_id: requestBody.tenant_id,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      // Add optional fields only if provided
      if (requestBody.sla_config !== undefined) upsertData.sla_config = requestBody.sla_config;
      if (requestBody.feature_flags !== undefined) upsertData.feature_flags = requestBody.feature_flags;
      if (requestBody.limits !== undefined) upsertData.limits = requestBody.limits;
      if (requestBody.notification_channels !== undefined) upsertData.notification_channels = requestBody.notification_channels;
      
      // Storage Limits
      if (requestBody.storage_limit_mb !== undefined) upsertData.storage_limit_mb = requestBody.storage_limit_mb;
      if (requestBody.storage_used_mb !== undefined) upsertData.storage_used_mb = requestBody.storage_used_mb;
      
      // API Rate Limits
      if (requestBody.api_rate_limit_per_minute !== undefined) upsertData.api_rate_limit_per_minute = requestBody.api_rate_limit_per_minute;
      if (requestBody.api_rate_limit_per_hour !== undefined) upsertData.api_rate_limit_per_hour = requestBody.api_rate_limit_per_hour;
      if (requestBody.api_unlimited !== undefined) upsertData.api_unlimited = requestBody.api_unlimited;
      
      // Email Quotas
      if (requestBody.email_quota_monthly !== undefined) upsertData.email_quota_monthly = requestBody.email_quota_monthly;
      if (requestBody.email_used_current_month !== undefined) upsertData.email_used_current_month = requestBody.email_used_current_month;
      if (requestBody.email_quota_reset_date !== undefined) upsertData.email_quota_reset_date = requestBody.email_quota_reset_date;
      
      // Custom Branding
      if (requestBody.branding_logo_url !== undefined) upsertData.branding_logo_url = requestBody.branding_logo_url;
      if (requestBody.branding_primary_color !== undefined) upsertData.branding_primary_color = requestBody.branding_primary_color;
      if (requestBody.branding_secondary_color !== undefined) upsertData.branding_secondary_color = requestBody.branding_secondary_color;
      if (requestBody.branding_app_name !== undefined) upsertData.branding_app_name = requestBody.branding_app_name;
      if (requestBody.branding_support_email !== undefined) upsertData.branding_support_email = requestBody.branding_support_email;
      if (requestBody.branding_support_phone !== undefined) upsertData.branding_support_phone = requestBody.branding_support_phone;
      
      // Security Settings - Password Policy
      if (requestBody.password_min_length !== undefined) upsertData.password_min_length = requestBody.password_min_length;
      if (requestBody.password_require_uppercase !== undefined) upsertData.password_require_uppercase = requestBody.password_require_uppercase;
      if (requestBody.password_require_lowercase !== undefined) upsertData.password_require_lowercase = requestBody.password_require_lowercase;
      if (requestBody.password_require_numbers !== undefined) upsertData.password_require_numbers = requestBody.password_require_numbers;
      if (requestBody.password_require_special_chars !== undefined) upsertData.password_require_special_chars = requestBody.password_require_special_chars;
      
      // Security Settings - MFA
      if (requestBody.mfa_required !== undefined) upsertData.mfa_required = requestBody.mfa_required;
      if (requestBody.mfa_methods !== undefined) upsertData.mfa_methods = requestBody.mfa_methods;
      
      // Security Settings - Session
      if (requestBody.session_timeout_minutes !== undefined) upsertData.session_timeout_minutes = requestBody.session_timeout_minutes;
      if (requestBody.session_absolute_timeout_minutes !== undefined) upsertData.session_absolute_timeout_minutes = requestBody.session_absolute_timeout_minutes;
      
      // Security Settings - Login Attempts
      if (requestBody.max_login_attempts !== undefined) upsertData.max_login_attempts = requestBody.max_login_attempts;
      if (requestBody.login_lockout_duration_minutes !== undefined) upsertData.login_lockout_duration_minutes = requestBody.login_lockout_duration_minutes;
      if (requestBody.login_notification_enabled !== undefined) upsertData.login_notification_enabled = requestBody.login_notification_enabled;
      
      // Security Settings - IP Whitelisting
      if (requestBody.ip_whitelist_enabled !== undefined) upsertData.ip_whitelist_enabled = requestBody.ip_whitelist_enabled;
      if (requestBody.ip_whitelist_ranges !== undefined) upsertData.ip_whitelist_ranges = requestBody.ip_whitelist_ranges;

      const { data: updatedSettings, error: upsertError } = await supabaseAdmin
        .from('admin_settings')
        .upsert(upsertData, {
          onConflict: 'tenant_id',
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Failed to update settings:', upsertError);
        return new Response(
          JSON.stringify({ success: false, message: `Failed to update settings: ${upsertError.message}`, error_code: 'DB_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Successfully updated settings');

      // Audit log: UPDATE_SETTINGS
      try {
        await supabaseAdmin.from('gate_p_audit_log').insert({
          tenant_id: requestBody.tenant_id,
          entity_type: 'admin_settings',
          entity_id: updatedSettings.id,
          action: 'tenant_settings.updated',
          actor_id: user.id,
          payload: {
            action_type: 'UPDATE_TENANT_SETTINGS',
            gate_code: 'Gate-P',
            updated_fields: Object.keys(requestBody).filter(k => k !== 'tenant_id'),
          },
        });
      } catch (auditError) {
        console.warn('Failed to log audit entry:', auditError);
      }

      const response: SettingsResponse = {
        success: true,
        data: updatedSettings,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Unexpected error in gate-p-tenant-settings:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error',
        error_code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fallback
  return new Response(
    JSON.stringify({ success: false, message: 'Unhandled request', error_code: 'UNHANDLED' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
