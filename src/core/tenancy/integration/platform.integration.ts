import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface TenantLifecycleLog {
  id: string;
  tenant_id: string;
  from_state: string | null;
  to_state: string | null;
  reason: string;
  triggered_by: string;
  trigger_source: string;
  created_at: string;
}

export interface TenantHealthStatus {
  id: string;
  tenant_id: string;
  health_status: string;
  drift_flag: string | null;
  details_json: any;
  last_checked_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  status: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all tenants
export async function fetchTenants() {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Tenant[];
}

// Fetch lifecycle log for a tenant
export async function fetchLifecycleLog(tenantId: string, limit = 50) {
  const { data, error } = await supabase
    .from('tenant_lifecycle_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as TenantLifecycleLog[];
}

// Fetch health status for a tenant
export async function fetchHealthStatus(tenantId: string) {
  const { data, error } = await supabase
    .from('tenant_health_status')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No data found
    throw error;
  }
  return data as TenantHealthStatus;
}

// Trigger tenant event (via RPC)
export async function triggerTenantEvent(tenantId: string, event: string, payload?: any) {
  const { data, error } = await supabase.rpc('fn_edge_tenant_event_inbound', {
    p_tenant_id: tenantId,
    p_event: event,
    p_payload: payload || {}
  });

  if (error) throw error;
  return data;
}

// Send notification
export async function sendTenantNotification(tenantId: string, message: string, payload?: any) {
  const { data, error } = await supabase.rpc('fn_tenant_notify_channels', {
    p_tenant_id: tenantId,
    p_message: message,
    p_payload: payload || {}
  });

  if (error) throw error;
  return data;
}

// Scheduled Transitions Types
export interface ScheduledTransition {
  id: string;
  tenant_id: string;
  from_state: string;
  to_state: string;
  scheduled_at: string;
  reason: string | null;
  status: 'pending' | 'executed' | 'cancelled' | 'failed';
  condition_check: any;
  executed_at: string | null;
  error_message: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Schedule a tenant transition
export async function scheduleTransition(
  tenantId: string,
  fromState: string,
  toState: string,
  scheduledAt: string,
  reason?: string,
  conditionCheck?: any
) {
  const { data, error } = await supabase.rpc('fn_schedule_tenant_transition', {
    p_tenant_id: tenantId,
    p_from_state: fromState,
    p_to_state: toState,
    p_scheduled_at: scheduledAt,
    p_reason: reason || null,
    p_condition_check: conditionCheck || {}
  });

  if (error) throw error;
  return data as string; // Returns transition ID
}

// Fetch scheduled transitions
export async function fetchScheduledTransitions(tenantId?: string, status?: string) {
  let query = supabase
    .from('tenant_scheduled_transitions')
    .select('*')
    .order('scheduled_at', { ascending: true });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ScheduledTransition[];
}

// Cancel a scheduled transition
export async function cancelScheduledTransition(transitionId: string) {
  const { data, error } = await supabase.rpc('fn_cancel_scheduled_transition', {
    p_transition_id: transitionId
  });

  if (error) throw error;
  return data;
}

// Update a scheduled transition
export async function updateScheduledTransition(
  transitionId: string,
  updates: {
    scheduled_at?: string;
    reason?: string;
    to_state?: string;
  }
) {
  const { data, error } = await supabase
    .from('tenant_scheduled_transitions')
    .update(updates)
    .eq('id', transitionId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) throw error;
  return data as ScheduledTransition;
}

// Start deprovision
export async function startDeprovision(tenantId: string) {
  const { data, error } = await supabase.rpc('fn_tenant_start_deprovision', {
    p_tenant_id: tenantId
  });

  if (error) throw error;
  return data;
}

// Fetch automation actions
export async function fetchAutomationActions(tenantId?: string) {
  let query = supabase
    .from('tenant_automation_actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},scope.eq.global`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================================================
// Tenant Settings Types & Functions (Gate-P)
// ============================================================================

export interface TenantSettings {
  id?: string;
  tenant_id?: string;
  sla_config: Record<string, any>;
  feature_flags: Record<string, any>;
  limits: Record<string, any>;
  notification_channels: Record<string, any>;
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
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface TenantSettingsResponse {
  success: boolean;
  data?: TenantSettings;
  message?: string;
  error_code?: string;
}

/**
 * Get tenant settings (Super Admin only)
 * @param tenantId - The tenant ID to get settings for
 */
export async function getTenantSettings(tenantId: string): Promise<TenantSettingsResponse> {
  if (!tenantId) {
    return {
      success: false,
      message: 'tenant_id is required',
      error_code: 'MISSING_TENANT_ID',
    };
  }

  try {
    // Use query params for GET request
    const url = `gate-p-tenant-settings?tenant_id=${encodeURIComponent(tenantId)}`;
    const { data, error } = await supabase.functions.invoke(url, {
      method: 'GET',
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get tenant settings',
        error_code: 'EDGE_FUNCTION_ERROR',
      };
    }

    return data as TenantSettingsResponse;
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      message: err.message || 'Network error',
      error_code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Update tenant settings (Super Admin only)
 * @param tenantId - The tenant ID to update settings for
 * @param settings - Partial settings object
 */
export async function updateTenantSettings(
  tenantId: string,
  settings: Partial<TenantSettings>
): Promise<TenantSettingsResponse> {
  if (!tenantId) {
    return {
      success: false,
      message: 'tenant_id is required',
      error_code: 'MISSING_TENANT_ID',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('gate-p-tenant-settings', {
      method: 'PUT',
      body: {
        tenant_id: tenantId,
        ...settings,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update tenant settings',
        error_code: 'EDGE_FUNCTION_ERROR',
      };
    }

    return data as TenantSettingsResponse;
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      message: err.message || 'Network error',
      error_code: 'NETWORK_ERROR',
    };
  }
}

// ============================================================================
// React Query Hooks for Tenant Settings
// ============================================================================

/**
 * React Query hook to fetch tenant settings
 */
export function useTenantSettings(tenantId: string) {
  return useQuery({
    queryKey: ['gate-p', 'tenant-settings', tenantId],
    queryFn: () => getTenantSettings(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook to fetch all tenants
 */
export function useTenants() {
  return useQuery({
    queryKey: ['gate-p', 'tenants'],
    queryFn: fetchTenants,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * React Query mutation to update tenant settings
 */
export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, settings }: { tenantId: string; settings: Partial<TenantSettings> }) =>
      updateTenantSettings(tenantId, settings),
    onSuccess: (_, variables) => {
      // Invalidate settings query for this tenant
      queryClient.invalidateQueries({ queryKey: ['gate-p', 'tenant-settings', variables.tenantId] });
    },
  });
}
