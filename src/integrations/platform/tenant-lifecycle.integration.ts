/**
 * M24 - Tenant Lifecycle Management Integration
 * 
 * Provides functions for tenant provisioning, subscriptions, usage tracking, and lifecycle events
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface TenantLifecycleEvent {
  id: string;
  tenant_id: string;
  event_type: 'provisioned' | 'activated' | 'suspended' | 'upgraded' | 'downgraded' | 'deprovisioned';
  event_status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  triggered_by: string | null;
  triggered_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  metadata: Record<string, any>;
  error_message: string | null;
  rollback_info: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_name: string;
  plan_tier: 'basic' | 'standard' | 'premium';
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  auto_renew: boolean;
  pricing_currency: string;
  monthly_price: number | null;
  yearly_price: number | null;
  user_limit: number | null;
  storage_limit_gb: number | null;
  api_calls_limit: number | null;
  features: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TenantUsageStats {
  id: string;
  tenant_id: string;
  stat_date: string;
  active_users_count: number;
  total_storage_gb: number;
  api_calls_count: number;
  database_queries_count: number;
  awareness_campaigns_count: number;
  phishing_simulations_count: number;
  incidents_count: number;
  policies_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Tenant Lifecycle Events Functions
// ============================================================================

/**
 * Fetch lifecycle events for a tenant
 */
export async function fetchTenantLifecycleEvents(params: {
  tenantId: string;
  eventType?: string;
  eventStatus?: string;
  limit?: number;
}): Promise<TenantLifecycleEvent[]> {
  let query = supabase
    .from('tenant_lifecycle_events')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .order('triggered_at', { ascending: false });

  if (params.eventType) {
    query = query.eq('event_type', params.eventType);
  }

  if (params.eventStatus) {
    query = query.eq('event_status', params.eventStatus);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching lifecycle events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new lifecycle event
 */
export async function createLifecycleEvent(event: {
  tenant_id: string;
  event_type: TenantLifecycleEvent['event_type'];
  event_status?: TenantLifecycleEvent['event_status'];
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  metadata?: Record<string, any>;
}): Promise<TenantLifecycleEvent> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('tenant_lifecycle_events')
    .insert({
      ...event,
      triggered_by: user?.id || null,
      event_status: event.event_status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lifecycle event:', error);
    throw error;
  }

  return data;
}

/**
 * Update lifecycle event status
 */
export async function updateLifecycleEventStatus(
  eventId: string,
  status: TenantLifecycleEvent['event_status'],
  options?: {
    errorMessage?: string;
    durationSeconds?: number;
  }
): Promise<TenantLifecycleEvent> {
  const updateData: any = {
    event_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (options?.errorMessage) {
    updateData.error_message = options.errorMessage;
  }

  if (options?.durationSeconds) {
    updateData.duration_seconds = options.durationSeconds;
  }

  const { data, error } = await supabase
    .from('tenant_lifecycle_events')
    .update(updateData)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating lifecycle event:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// Tenant Subscription Functions
// ============================================================================

/**
 * Fetch subscription for a tenant
 */
export async function fetchTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching tenant subscription:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new tenant subscription
 */
export async function createTenantSubscription(subscription: {
  tenant_id: string;
  plan_name: string;
  plan_tier: TenantSubscription['plan_tier'];
  billing_cycle?: TenantSubscription['billing_cycle'];
  start_date: string;
  end_date?: string;
  trial_end_date?: string;
  monthly_price?: number;
  yearly_price?: number;
  user_limit?: number;
  storage_limit_gb?: number;
  api_calls_limit?: number;
  features?: Record<string, any>;
}): Promise<TenantSubscription> {
  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .insert(subscription)
    .select()
    .single();

  if (error) {
    console.error('Error creating tenant subscription:', error);
    throw error;
  }

  // Create lifecycle event
  await createLifecycleEvent({
    tenant_id: subscription.tenant_id,
    event_type: 'provisioned',
    event_status: 'completed',
    new_state: { subscription },
  });

  return data;
}

/**
 * Update tenant subscription (upgrade/downgrade)
 */
export async function updateTenantSubscription(
  tenantId: string,
  updates: Partial<TenantSubscription>
): Promise<TenantSubscription> {
  // Fetch current subscription for lifecycle event
  const currentSubscription = await fetchTenantSubscription(tenantId);

  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating tenant subscription:', error);
    throw error;
  }

  // Create lifecycle event for upgrade/downgrade
  if (updates.plan_name || updates.plan_tier) {
    const eventType = currentSubscription && updates.plan_name 
      ? (updates.plan_name > currentSubscription.plan_name ? 'upgraded' : 'downgraded')
      : 'upgraded';

    await createLifecycleEvent({
      tenant_id: tenantId,
      event_type: eventType,
      event_status: 'completed',
      previous_state: currentSubscription,
      new_state: data,
    });
  }

  return data;
}

/**
 * Cancel tenant subscription
 */
export async function cancelTenantSubscription(
  tenantId: string,
  immediate: boolean = false
): Promise<TenantSubscription> {
  const updateData: any = {
    subscription_status: 'cancelled' as const,
    auto_renew: false,
    updated_at: new Date().toISOString(),
  };

  if (immediate) {
    updateData.end_date = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling tenant subscription:', error);
    throw error;
  }

  return data;
}

/**
 * Suspend tenant subscription
 */
export async function suspendTenantSubscription(
  tenantId: string,
  reason?: string
): Promise<TenantSubscription> {
  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .update({
      subscription_status: 'suspended' as const,
      metadata: { suspension_reason: reason },
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error suspending tenant subscription:', error);
    throw error;
  }

  // Create lifecycle event
  await createLifecycleEvent({
    tenant_id: tenantId,
    event_type: 'suspended',
    event_status: 'completed',
    metadata: { reason },
  });

  return data;
}

/**
 * Reactivate tenant subscription
 */
export async function reactivateTenantSubscription(
  tenantId: string
): Promise<TenantSubscription> {
  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .update({
      subscription_status: 'active' as const,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error reactivating tenant subscription:', error);
    throw error;
  }

  // Create lifecycle event
  await createLifecycleEvent({
    tenant_id: tenantId,
    event_type: 'activated',
    event_status: 'completed',
  });

  return data;
}

// ============================================================================
// Tenant Usage Stats Functions
// ============================================================================

/**
 * Fetch usage stats for a tenant
 */
export async function fetchTenantUsageStats(params: {
  tenantId: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<TenantUsageStats[]> {
  let query = supabase
    .from('tenant_usage_stats')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .order('stat_date', { ascending: false });

  if (params.fromDate) {
    query = query.gte('stat_date', params.fromDate);
  }

  if (params.toDate) {
    query = query.lte('stat_date', params.toDate);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching usage stats:', error);
    throw error;
  }

  return data || [];
}

/**
 * Record usage stats for today
 */
export async function recordTenantUsageStats(stats: {
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
}): Promise<TenantUsageStats> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tenant_usage_stats')
    .upsert({
      ...stats,
      stat_date: today,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'tenant_id,stat_date',
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording usage stats:', error);
    throw error;
  }

  return data;
}

/**
 * Get current usage vs limits for a tenant
 */
export async function getTenantUsageVsLimits(tenantId: string): Promise<{
  subscription: TenantSubscription | null;
  currentUsage: TenantUsageStats | null;
  usagePercentages: {
    users: number;
    storage: number;
    apiCalls: number;
  };
  exceedsLimits: boolean;
}> {
  const subscription = await fetchTenantSubscription(tenantId);
  
  const today = new Date().toISOString().split('T')[0];
  const usageStats = await fetchTenantUsageStats({
    tenantId,
    fromDate: today,
    limit: 1,
  });

  const currentUsage = usageStats[0] || null;

  const usagePercentages = {
    users: subscription?.user_limit && currentUsage
      ? (currentUsage.active_users_count / subscription.user_limit) * 100
      : 0,
    storage: subscription?.storage_limit_gb && currentUsage
      ? (currentUsage.total_storage_gb / subscription.storage_limit_gb) * 100
      : 0,
    apiCalls: subscription?.api_calls_limit && currentUsage
      ? (currentUsage.api_calls_count / subscription.api_calls_limit) * 100
      : 0,
  };

  const exceedsLimits = Object.values(usagePercentages).some(pct => pct > 100);

  return {
    subscription,
    currentUsage,
    usagePercentages,
    exceedsLimits,
  };
}
