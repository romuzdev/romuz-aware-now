/**
 * M24 - Tenant Lifecycle Management Hooks
 * React Query hooks for tenant lifecycle, subscriptions, and usage
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTenantLifecycleEvents,
  createLifecycleEvent,
  updateLifecycleEventStatus,
  fetchTenantSubscription,
  createTenantSubscription,
  updateTenantSubscription,
  cancelTenantSubscription,
  suspendTenantSubscription,
  reactivateTenantSubscription,
  fetchTenantUsageStats,
  recordTenantUsageStats,
  getTenantUsageVsLimits,
} from '@/integrations/platform/tenant-lifecycle.integration';
import type { Database } from '@/integrations/supabase/types';

type TenantLifecycleEvent = Database['public']['Tables']['tenant_lifecycle_events']['Row'];
type TenantLifecycleEventInsert = Database['public']['Tables']['tenant_lifecycle_events']['Insert'];
type TenantSubscription = Database['public']['Tables']['tenant_subscriptions']['Row'];
type TenantSubscriptionInsert = Database['public']['Tables']['tenant_subscriptions']['Insert'];
type TenantUsageStats = Database['public']['Tables']['tenant_usage_stats']['Row'];
type TenantUsageStatsInsert = Database['public']['Tables']['tenant_usage_stats']['Insert'];

// Query Keys
export const tenantLifecycleKeys = {
  all: ['tenant-lifecycle'] as const,
  events: () => [...tenantLifecycleKeys.all, 'events'] as const,
  eventsByTenant: (tenantId: string) => [...tenantLifecycleKeys.events(), tenantId] as const,
  subscriptions: () => [...tenantLifecycleKeys.all, 'subscriptions'] as const,
  subscription: (tenantId: string) => [...tenantLifecycleKeys.subscriptions(), tenantId] as const,
  usage: () => [...tenantLifecycleKeys.all, 'usage'] as const,
  usageByTenant: (tenantId: string, period?: string) => [...tenantLifecycleKeys.usage(), tenantId, period] as const,
  usageVsLimits: (tenantId: string) => [...tenantLifecycleKeys.usage(), tenantId, 'limits'] as const,
};

/**
 * Fetch tenant lifecycle events
 */
export function useTenantLifecycleEvents(tenantId: string, eventType?: string, eventStatus?: string) {
  return useQuery({
    queryKey: tenantLifecycleKeys.eventsByTenant(tenantId),
    queryFn: () => fetchTenantLifecycleEvents({ tenantId, eventType, eventStatus }),
    enabled: !!tenantId,
  });
}

/**
 * Create a lifecycle event
 */
export function useCreateLifecycleEvent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tenant_id: string;
      event_type: 'provisioned' | 'activated' | 'suspended' | 'upgraded' | 'downgraded' | 'deprovisioned';
      event_status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
      previous_state?: Record<string, any>;
      new_state?: Record<string, any>;
      metadata?: Record<string, any>;
    }) => createLifecycleEvent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.eventsByTenant(variables.tenant_id) });
      toast({
        title: 'تم التسجيل',
        description: 'تم تسجيل الحدث بنجاح',
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
 * Update lifecycle event status
 */
export function useUpdateLifecycleEventStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, status, metadata }: {
      eventId: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
      metadata?: any;
    }) => updateLifecycleEventStatus(eventId, status, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.events() });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الحدث',
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
 * Fetch tenant subscription
 */
export function useTenantSubscription(tenantId: string) {
  return useQuery({
    queryKey: tenantLifecycleKeys.subscription(tenantId),
    queryFn: () => fetchTenantSubscription(tenantId),
    enabled: !!tenantId,
  });
}

/**
 * Create tenant subscription
 */
export function useCreateTenantSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tenant_id: string;
      plan_name: string;
      plan_tier: 'basic' | 'standard' | 'premium';
      billing_cycle?: 'monthly' | 'yearly' | 'quarterly';
      start_date: string;
      end_date?: string;
      trial_end_date?: string;
      monthly_price?: number;
      yearly_price?: number;
      users_limit?: number;
      storage_limit_gb?: number;
      api_calls_limit?: number;
      features?: Record<string, any>;
    }) => createTenantSubscription(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.subscription(variables.tenant_id) });
      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء الاشتراك بنجاح',
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
 * Update tenant subscription
 */
export function useUpdateTenantSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, updates }: {
      tenantId: string;
      updates: Partial<{
        plan_name: string;
        plan_tier: 'basic' | 'standard' | 'premium';
        billing_cycle: 'monthly' | 'yearly' | 'quarterly';
        end_date: string;
        monthly_price: number;
        yearly_price: number;
        users_limit: number;
        storage_limit_gb: number;
        api_calls_limit: number;
        auto_renew: boolean;
        features: Record<string, any>;
      }>;
    }) => updateTenantSubscription(tenantId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.subscription(variables.tenantId) });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الاشتراك بنجاح',
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
 * Cancel tenant subscription
 */
export function useCancelTenantSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, immediate }: { tenantId: string; immediate?: boolean }) =>
      cancelTenantSubscription(tenantId, immediate || false),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.subscription(variables.tenantId) });
      toast({
        title: 'تم الإلغاء',
        description: 'تم إلغاء الاشتراك',
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
 * Suspend tenant subscription
 */
export function useSuspendTenantSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason?: string }) =>
      suspendTenantSubscription(tenantId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.subscription(variables.tenantId) });
      toast({
        title: 'تم التعليق',
        description: 'تم تعليق الاشتراك',
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
 * Reactivate tenant subscription
 */
export function useReactivateTenantSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => reactivateTenantSubscription(tenantId),
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.subscription(tenantId) });
      toast({
        title: 'تم التفعيل',
        description: 'تم تفعيل الاشتراك بنجاح',
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
 * Fetch tenant usage stats
 */
export function useTenantUsageStats(tenantId: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: tenantLifecycleKeys.usageByTenant(tenantId),
    queryFn: () => fetchTenantUsageStats({ tenantId, fromDate, toDate }),
    enabled: !!tenantId,
  });
}

/**
 * Record tenant usage stats
 */
export function useRecordTenantUsageStats() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tenant_id: string;
      active_users_count: number;
      total_storage_gb: number;
      api_calls_count: number;
      database_queries_count: number;
      awareness_campaigns_count: number;
      phishing_simulations_count: number;
      incidents_count: number;
      policies_count: number;
      metadata?: Record<string, any>;
    }) => recordTenantUsageStats(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantLifecycleKeys.usageByTenant(variables.tenant_id) });
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
 * Get tenant usage vs limits
 */
export function useTenantUsageVsLimits(tenantId: string) {
  return useQuery({
    queryKey: tenantLifecycleKeys.usageVsLimits(tenantId),
    queryFn: () => getTenantUsageVsLimits(tenantId),
    enabled: !!tenantId,
    refetchInterval: 60000, // Refetch every minute
  });
}
