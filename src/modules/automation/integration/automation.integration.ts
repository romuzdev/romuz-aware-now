/**
 * Automation Integration Layer
 * Week 4 - Phase 4
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AutomationRule,
  AutomationRuleFormData,
  WorkflowExecution,
  AutomationStats,
} from '../types/automation.types';

/**
 * Fetch automation rules
 */
export async function fetchAutomationRules(tenantId: string): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('priority', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch single automation rule
 */
export async function fetchAutomationRuleById(id: string): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create automation rule
 */
export async function createAutomationRule(
  tenantId: string,
  formData: AutomationRuleFormData
): Promise<AutomationRule> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('automation_rules')
    .insert({
      tenant_id: tenantId,
      ...formData,
      created_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update automation rule
 */
export async function updateAutomationRule(
  id: string,
  formData: Partial<AutomationRuleFormData>
): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from('automation_rules')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete automation rule
 */
export async function deleteAutomationRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Toggle automation rule
 */
export async function toggleAutomationRule(
  id: string,
  isEnabled: boolean
): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from('automation_rules')
    .update({ is_enabled: isEnabled })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch workflow executions
 */
export async function fetchWorkflowExecutions(
  tenantId: string,
  ruleId?: string
): Promise<WorkflowExecution[]> {
  let query = supabase
    .from('workflow_executions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (ruleId) {
    query = query.eq('rule_id', ruleId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Trigger automation rule manually
 */
export async function triggerAutomationRule(
  ruleId: string,
  triggerData?: Record<string, any>
): Promise<void> {
  const { error } = await supabase.functions.invoke('automation-trigger', {
    body: {
      rule_id: ruleId,
      trigger_data: triggerData || {},
    },
  });

  if (error) throw error;
}

/**
 * Get automation statistics
 */
export async function fetchAutomationStats(tenantId: string): Promise<AutomationStats> {
  // Fetch rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('id, is_enabled')
    .eq('tenant_id', tenantId);

  // Fetch executions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: executions } = await supabase
    .from('workflow_executions')
    .select('status, started_at, completed_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const totalRules = rules?.length || 0;
  const activeRules = rules?.filter(r => r.is_enabled).length || 0;
  const totalExecutions = executions?.length || 0;
  const successfulExecutions = executions?.filter(e => e.status === 'completed').length || 0;
  const failedExecutions = executions?.filter(e => e.status === 'failed').length || 0;

  // Calculate average execution time
  const executionTimes = executions
    ?.filter(e => e.started_at && e.completed_at)
    .map(e => {
      const start = new Date(e.started_at!).getTime();
      const end = new Date(e.completed_at!).getTime();
      return end - start;
    }) || [];

  const avgExecutionTime = executionTimes.length > 0
    ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
    : 0;

  return {
    total_rules: totalRules,
    active_rules: activeRules,
    total_executions: totalExecutions,
    successful_executions: successfulExecutions,
    failed_executions: failedExecutions,
    avg_execution_time_ms: avgExecutionTime,
  };
}
