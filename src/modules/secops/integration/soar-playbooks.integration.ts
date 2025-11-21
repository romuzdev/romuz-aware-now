/**
 * SOAR Playbooks Integration Layer
 * M18.5 - SecOps Integration
 */

import { supabase } from '@/integrations/supabase/client';
import type { SOARPlaybook, SOARPlaybookFilters } from '../types';
import { logPlaybookAction } from '@/lib/audit/secops-audit-logger';

/**
 * Fetch SOAR playbooks with filters
 */
export async function fetchSOARPlaybooks(
  filters?: SOARPlaybookFilters
): Promise<SOARPlaybook[]> {
  let query = supabase
    .from('soar_playbooks')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.search) {
    query = query.or(
      `playbook_name_ar.ilike.%${filters.search}%,playbook_name_en.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as SOARPlaybook[];
}

/**
 * Fetch a single SOAR playbook by ID
 */
export async function fetchSOARPlaybookById(id: string): Promise<SOARPlaybook> {
  const { data, error } = await supabase
    .from('soar_playbooks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Log read action
  await logPlaybookAction(id, 'read');

  return data as SOARPlaybook;
}

/**
 * Create a new SOAR playbook
 */
export async function createSOARPlaybook(
  playbook: Omit<SOARPlaybook, 'id' | 'execution_count' | 'success_count' | 'created_at' | 'updated_at'>
): Promise<SOARPlaybook> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('soar_playbooks')
    .insert({
      ...playbook,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log create action
  await logPlaybookAction(data.id, 'create', {
    playbook_name_ar: playbook.playbook_name_ar,
    is_active: playbook.is_active,
  });

  return data as SOARPlaybook;
}

/**
 * Update SOAR playbook
 */
export async function updateSOARPlaybook(
  id: string,
  updates: Partial<SOARPlaybook>
): Promise<SOARPlaybook> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('soar_playbooks')
    .update({
      ...updates,
      updated_by: user?.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log update action
  await logPlaybookAction(id, 'update', updates);

  return data as SOARPlaybook;
}

/**
 * Delete SOAR playbook
 */
export async function deleteSOARPlaybook(id: string): Promise<void> {
  const { error } = await supabase.from('soar_playbooks').delete().eq('id', id);

  if (error) throw error;

  // Log delete action
  await logPlaybookAction(id, 'delete');
}

/**
 * Activate playbook
 */
export async function activatePlaybook(id: string): Promise<void> {
  await updateSOARPlaybook(id, { is_active: true });
  await logPlaybookAction(id, 'activate');
}

/**
 * Deactivate playbook
 */
export async function deactivatePlaybook(id: string): Promise<void> {
  await updateSOARPlaybook(id, { is_active: false });
  await logPlaybookAction(id, 'deactivate');
}

/**
 * Get active playbooks count
 */
export async function getActivePlaybooksCount(): Promise<number> {
  const { count, error } = await supabase
    .from('soar_playbooks')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) throw error;
  return count || 0;
}

/**
 * Increment execution count after playbook runs
 */
export async function incrementPlaybookExecutionCount(
  id: string,
  success: boolean
): Promise<void> {
  const { data: playbook } = await supabase
    .from('soar_playbooks')
    .select('execution_count, success_count')
    .eq('id', id)
    .single();

  if (!playbook) return;

  const updates: any = {
    execution_count: playbook.execution_count + 1,
    last_executed_at: new Date().toISOString(),
  };

  if (success) {
    updates.success_count = playbook.success_count + 1;
  }

  await updateSOARPlaybook(id, updates);
}
