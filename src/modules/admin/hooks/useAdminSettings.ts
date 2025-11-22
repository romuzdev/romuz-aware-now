/**
 * M22 - Admin Console Enhancement Hooks
 * React Query hooks for admin settings and system configurations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchAdminSettings,
  updateBrandingSettings,
  updateSecuritySettings,
  setMaintenanceMode,
  updateFeatureFlags,
  fetchSystemConfigurations,
  getConfigurationValue,
  setConfigurationValue,
  deleteConfiguration,
  bulkUpdateConfigurations,
} from '@/integrations/admin/admin-settings.integration';
import type { Database } from '@/integrations/supabase/types';

type AdminSettings = Database['public']['Tables']['admin_settings']['Row'];
type SystemConfiguration = Database['public']['Tables']['system_configurations']['Row'];

// Query Keys
export const adminSettingsKeys = {
  all: ['admin-settings'] as const,
  settings: (tenantId: string) => [...adminSettingsKeys.all, tenantId] as const,
  configurations: () => [...adminSettingsKeys.all, 'configurations'] as const,
  configurationsByCategory: (category?: string) => [...adminSettingsKeys.configurations(), category] as const,
  configurationValue: (key: string) => [...adminSettingsKeys.configurations(), 'value', key] as const,
};

/**
 * Fetch admin settings for a tenant
 */
export function useAdminSettings(tenantId: string) {
  return useQuery({
    queryKey: adminSettingsKeys.settings(tenantId),
    queryFn: () => fetchAdminSettings(tenantId),
    enabled: !!tenantId,
  });
}

/**
 * Update branding settings
 */
export function useUpdateBrandingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, branding }: {
      tenantId: string;
      branding: {
        app_name?: string;
        logo_url?: string;
        primary_color?: string;
        secondary_color?: string;
        support_email?: string;
        support_phone?: string;
        custom_css?: string;
      };
    }) => updateBrandingSettings(tenantId, branding),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.settings(variables.tenantId) });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث إعدادات العلامة التجارية بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update security settings
 */
export function useUpdateSecuritySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, security }: {
      tenantId: string;
      security: {
        password_min_length?: number;
        password_require_uppercase?: boolean;
        password_require_lowercase?: boolean;
        password_require_numbers?: boolean;
        password_require_special_chars?: boolean;
        session_timeout_minutes?: number;
        session_absolute_timeout_minutes?: number;
        max_login_attempts?: number;
        login_lockout_duration_minutes?: number;
        mfa_required?: boolean;
        mfa_methods?: any;
        ip_whitelist_enabled?: boolean;
        ip_whitelist_ranges?: any;
      };
    }) => updateSecuritySettings(tenantId, security),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.settings(variables.tenantId) });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث إعدادات الأمان بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Set maintenance mode
 */
export function useSetMaintenanceMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, enabled, message }: {
      tenantId: string;
      enabled: boolean;
      message?: string;
    }) => setMaintenanceMode(tenantId, enabled, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.settings(variables.tenantId) });
      toast({
        title: variables.enabled ? 'تم التفعيل' : 'تم الإيقاف',
        description: variables.enabled
          ? 'تم تفعيل وضع الصيانة'
          : 'تم إيقاف وضع الصيانة',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update feature flags
 */
export function useUpdateFeatureFlags() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, featureFlags }: {
      tenantId: string;
      featureFlags: Record<string, boolean>;
    }) => updateFeatureFlags(tenantId, featureFlags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.settings(variables.tenantId) });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث ميزات النظام بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Fetch system configurations
 */
export function useSystemConfigurations(tenantId: string, category?: string) {
  return useQuery({
    queryKey: adminSettingsKeys.configurationsByCategory(category),
    queryFn: () => fetchSystemConfigurations({ tenantId, category }),
    enabled: !!tenantId,
  });
}

/**
 * Get a specific configuration value
 */
export function useConfigurationValue(tenantId: string, key: string) {
  return useQuery({
    queryKey: adminSettingsKeys.configurationValue(key),
    queryFn: () => getConfigurationValue(tenantId, key),
    enabled: !!key && !!tenantId,
  });
}

/**
 * Set a configuration value
 */
export function useSetConfigurationValue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, key, value, options }: {
      tenantId: string;
      key: string;
      value: any;
      options?: {
        configType?: 'string' | 'number' | 'boolean' | 'json';
        category?: 'ui' | 'performance' | 'integration' | 'security' | 'notification';
        description?: string;
        isSensitive?: boolean;
        isReadonly?: boolean;
      };
    }) => setConfigurationValue(tenantId, key, value, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.configurations() });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الإعداد بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a configuration
 */
export function useDeleteConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, key }: { tenantId: string; key: string }) =>
      deleteConfiguration(tenantId, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.configurations() });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإعداد بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Bulk update configurations
 */
export function useBulkUpdateConfigurations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, configurations }: {
      tenantId: string;
      configurations: Array<{
        key: string;
        value: string;
        category?: string;
        description?: string;
      }>;
    }) => bulkUpdateConfigurations(tenantId, configurations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.configurations() });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الإعدادات بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
