/**
 * Event System Helper Functions
 * 
 * Utility functions for fetching and managing events
 */

import { supabase } from '@/integrations/supabase/client';
import type { SystemEvent, EventStatistics, EventExecutionLog, AutomationRule } from './event.types';

// ============================================================================
// Event Queries
// ============================================================================

/**
 * Fetch recent events with optional filters
 */
export async function fetchRecentEvents(
  limit: number = 50,
  filters?: {
    event_type?: string;
    event_category?: string;
    source_module?: string;
    status?: string;
    priority?: string;
  }
) {
  let query = supabase
    .from('system_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type);
  }
  if (filters?.event_category) {
    query = query.eq('event_category', filters.event_category);
  }
  if (filters?.source_module) {
    query = query.eq('source_module', filters.source_module);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }

  return data as SystemEvent[];
}

/**
 * Fetch event by ID
 */
export async function fetchEventById(eventId: string) {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Failed to fetch event:', error);
    throw error;
  }

  return data as SystemEvent;
}

/**
 * Fetch execution logs for a specific event
 */
export async function fetchEventExecutionLogs(eventId: string) {
  const { data, error } = await supabase
    .from('event_execution_log')
    .select(`
      *,
      rule:automation_rules(
        id,
        rule_name,
        description_ar
      )
    `)
    .eq('event_id', eventId)
    .order('executed_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch execution logs:', error);
    throw error;
  }

  return data as (EventExecutionLog & { rule?: Partial<AutomationRule> })[];
}

/**
 * Get event statistics for the current tenant
 */
export async function getEventStatistics(
  dateFrom?: string,
  dateTo?: string
) {
  const { data, error } = await supabase.rpc('fn_get_event_statistics', {
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
  });

  if (error) {
    console.error('Failed to fetch event statistics:', error);
    throw error;
  }

  return data[0] as EventStatistics;
}

// ============================================================================
// Automation Rules Queries
// ============================================================================

/**
 * Fetch all automation rules
 */
export async function fetchAutomationRules(filters?: {
  is_enabled?: boolean;
  event_type?: string;
}) {
  let query = supabase
    .from('automation_rules')
    .select('*')
    .order('priority', { ascending: false });

  if (filters?.is_enabled !== undefined) {
    query = query.eq('is_enabled', filters.is_enabled);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch automation rules:', error);
    throw error;
  }

  // Filter by event_type if provided (since it's an array column)
  if (filters?.event_type) {
    return data.filter((rule: any) => 
      rule.trigger_event_types.includes(filters.event_type)
    ) as AutomationRule[];
  }

  return data as AutomationRule[];
}

/**
 * Fetch automation rule by ID
 */
export async function fetchAutomationRuleById(ruleId: string) {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error) {
    console.error('Failed to fetch automation rule:', error);
    throw error;
  }

  return data as AutomationRule;
}

/**
 * Create new automation rule
 */
export async function createAutomationRule(rule: Partial<AutomationRule>) {
  const { data, error } = await supabase
    .from('automation_rules')
    .insert([rule])
    .select()
    .single();

  if (error) {
    console.error('Failed to create automation rule:', error);
    throw error;
  }

  return data as AutomationRule;
}

/**
 * Update automation rule
 */
export async function updateAutomationRule(ruleId: string, updates: Partial<AutomationRule>) {
  const { data, error } = await supabase
    .from('automation_rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update automation rule:', error);
    throw error;
  }

  return data as AutomationRule;
}

/**
 * Delete automation rule
 */
export async function deleteAutomationRule(ruleId: string) {
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', ruleId);

  if (error) {
    console.error('Failed to delete automation rule:', error);
    throw error;
  }

  return true;
}

/**
 * Toggle automation rule enabled/disabled
 */
export async function toggleAutomationRule(ruleId: string, isEnabled: boolean) {
  return updateAutomationRule(ruleId, { is_enabled: isEnabled });
}

// ============================================================================
// Event Analytics
// ============================================================================

/**
 * Get events grouped by category
 */
export async function getEventsByCategory(
  dateFrom?: string,
  dateTo?: string
) {
  let query = supabase
    .from('system_events')
    .select('event_category');

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch events by category:', error);
    throw error;
  }

  // Group by category
  const grouped = data.reduce((acc: Record<string, number>, event: any) => {
    acc[event.event_category] = (acc[event.event_category] || 0) + 1;
    return acc;
  }, {});

  return grouped;
}

/**
 * Get events grouped by priority
 */
export async function getEventsByPriority(
  dateFrom?: string,
  dateTo?: string
) {
  let query = supabase
    .from('system_events')
    .select('priority');

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch events by priority:', error);
    throw error;
  }

  // Group by priority
  const grouped = data.reduce((acc: Record<string, number>, event: any) => {
    acc[event.priority] = (acc[event.priority] || 0) + 1;
    return acc;
  }, {});

  return grouped;
}

// ============================================================================
// Event Subscriptions
// ============================================================================

/**
 * Get all event subscriptions
 */
export async function fetchEventSubscriptions() {
  const { data, error } = await supabase
    .from('event_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch event subscriptions:', error);
    throw error;
  }

  return data;
}

/**
 * Create event subscription
 */
export async function createEventSubscription(subscription: {
  subscriber_module: string;
  event_types: string[];
  callback_url?: string;
  metadata?: Record<string, any>;
}) {
  const { data, error } = await supabase
    .from('event_subscriptions')
    .insert([subscription])
    .select()
    .single();

  if (error) {
    console.error('Failed to create event subscription:', error);
    throw error;
  }

  return data;
}

/**
 * Delete event subscription
 */
export async function deleteEventSubscription(subscriptionId: string) {
  const { error } = await supabase
    .from('event_subscriptions')
    .delete()
    .eq('id', subscriptionId);

  if (error) {
    console.error('Failed to delete event subscription:', error);
    throw error;
  }

  return true;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format event timestamp to locale string
 */
export function formatEventTimestamp(timestamp: string, locale: string = 'ar-SA'): string {
  return new Date(timestamp).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get event priority color
 */
export function getEventPriorityColor(priority: string): string {
  const colors = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  };
  return colors[priority as keyof typeof colors] || 'text-gray-500';
}

/**
 * Get event status color
 */
export function getEventStatusColor(status: string): string {
  const colors = {
    pending: 'text-yellow-500',
    processing: 'text-blue-500',
    processed: 'text-green-500',
    failed: 'text-red-500',
  };
  return colors[status as keyof typeof colors] || 'text-gray-500';
}
