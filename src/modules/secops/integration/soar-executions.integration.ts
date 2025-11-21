/**
 * SOAR Executions Integration Layer
 * M18.5 - SecOps Integration
 */

import { supabase } from '@/integrations/supabase/client';
import type { SOARExecution, ExecutionStatus } from '../types';
import { logExecutionAction } from '@/lib/audit/secops-audit-logger';

/**
 * Fetch SOAR executions
 */
export async function fetchSOARExecutions(
  playbookId?: string,
  status?: ExecutionStatus
): Promise<SOARExecution[]> {
  let query = supabase
    .from('soar_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50);

  if (playbookId) {
    query = query.eq('playbook_id', playbookId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as SOARExecution[];
}

/**
 * Fetch a single SOAR execution by ID
 */
export async function fetchSOARExecutionById(id: string): Promise<SOARExecution> {
  const { data, error } = await supabase
    .from('soar_executions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as SOARExecution;
}

/**
 * Create a new SOAR execution
 */
export async function createSOARExecution(
  execution: Omit<SOARExecution, 'id' | 'started_at' | 'created_at'>
): Promise<SOARExecution> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('soar_executions')
    .insert({
      ...execution,
      executed_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log create action
  await logExecutionAction(data.id, 'create', {
    playbook_id: execution.playbook_id,
    status: execution.status,
  });

  return data as SOARExecution;
}

/**
 * Update SOAR execution status and log
 */
export async function updateSOARExecution(
  id: string,
  updates: Partial<SOARExecution>
): Promise<SOARExecution> {
  const { data, error } = await supabase
    .from('soar_executions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log update action
  await logExecutionAction(id, 'update', updates);

  return data as SOARExecution;
}

/**
 * Mark execution as completed
 */
export async function completeExecution(
  id: string,
  result: Record<string, any>
): Promise<void> {
  await updateSOARExecution(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    result,
  });
}

/**
 * Mark execution as failed
 */
export async function failExecution(id: string, error: string): Promise<void> {
  await updateSOARExecution(id, {
    status: 'failed',
    completed_at: new Date().toISOString(),
    error_message: error,
  });
}

/**
 * Cancel execution
 */
export async function cancelExecution(id: string): Promise<void> {
  await updateSOARExecution(id, {
    status: 'cancelled',
    completed_at: new Date().toISOString(),
  });
}

/**
 * Get running executions count
 */
export async function getRunningExecutionsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('soar_executions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'running');

  if (error) throw error;
  return count || 0;
}

/**
 * Get recent executions (last 24 hours)
 */
export async function fetchRecentExecutions(limit: number = 20): Promise<SOARExecution[]> {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data, error } = await supabase
    .from('soar_executions')
    .select('*')
    .gte('started_at', twentyFourHoursAgo.toISOString())
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as SOARExecution[];
}
