/**
 * M25 - Playbooks Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { Playbook, PlaybookFilters, PlaybookStatus } from '../types';

/**
 * Get all playbooks with filters
 */
export async function getPlaybooks(filters?: PlaybookFilters): Promise<Playbook[]> {
  let query = supabase
    .from('success_playbooks')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }

  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority);
  }

  if (filters?.search) {
    query = query.or(`title_ar.ilike.%${filters.search}%,title_en.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get active playbooks
 */
export async function getActivePlaybooks(): Promise<Playbook[]> {
  return getPlaybooks({ status: ['active'] });
}

/**
 * Get playbook by ID
 */
export async function getPlaybookById(id: string): Promise<Playbook | null> {
  const { data, error } = await supabase
    .from('success_playbooks')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create playbook
 */
export async function createPlaybook(params: {
  playbook_key: string;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  trigger_conditions: Record<string, any>;
  priority?: string;
  due_date?: string;
}): Promise<Playbook> {
  const { data, error } = await supabase
    .from('success_playbooks')
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update playbook status
 */
export async function updatePlaybookStatus(
  id: string,
  status: PlaybookStatus
): Promise<Playbook> {
  const updates: any = { status };

  if (status === 'active' && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('success_playbooks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update playbook progress
 */
export async function updatePlaybookProgress(
  id: string,
  completed_actions: number,
  total_actions: number
): Promise<Playbook> {
  const progress_pct = Math.round((completed_actions / total_actions) * 100);

  const { data, error } = await supabase
    .from('success_playbooks')
    .update({
      completed_actions,
      total_actions,
      progress_pct,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete playbook
 */
export async function deletePlaybook(id: string): Promise<void> {
  const { error } = await supabase
    .from('success_playbooks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
