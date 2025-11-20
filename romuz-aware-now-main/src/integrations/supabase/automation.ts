/**
 * Automation Rules Integration Layer
 * 
 * All Supabase automation_rules table operations
 * Following project guidelines: NO direct supabase calls in components
 */

import { supabase } from './client';
import type { AutomationRule } from '@/lib/events/event.types';

/**
 * List all automation rules with optional filters
 */
export async function listAutomationRules(filters?: {
  is_enabled?: boolean;
  search?: string;
}) {
  let query = supabase
    .from('automation_rules')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters?.is_enabled !== undefined) {
    query = query.eq('is_enabled', filters.is_enabled);
  }
  
  if (filters?.search) {
    query = query.or(
      `rule_name.ilike.%${filters.search}%,description_ar.ilike.%${filters.search}%`
    );
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AutomationRule[];
}

/**
 * Get a single automation rule by ID
 */
export async function getAutomationRule(id: string) {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as AutomationRule;
}

/**
 * Create a new automation rule
 */
export async function createAutomationRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('automation_rules')
    .insert([{
      ...rule,
      execution_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data as AutomationRule;
}

/**
 * Update an existing automation rule
 */
export async function updateAutomationRule(
  id: string,
  updates: Partial<AutomationRule>
) {
  const { data, error } = await supabase
    .from('automation_rules')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as AutomationRule;
}

/**
 * Delete an automation rule
 */
export async function deleteAutomationRule(id: string) {
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

/**
 * Toggle rule enabled/disabled status
 */
export async function toggleAutomationRule(id: string, is_enabled: boolean) {
  return updateAutomationRule(id, { is_enabled: !is_enabled });
}

/**
 * Increment execution count
 */
export async function incrementExecutionCount(id: string) {
  const { data: rule } = await supabase
    .from('automation_rules')
    .select('execution_count')
    .eq('id', id)
    .single();
  
  if (!rule) return;
  
  return updateAutomationRule(id, {
    execution_count: (rule.execution_count || 0) + 1,
    last_executed_at: new Date().toISOString(),
  });
}
