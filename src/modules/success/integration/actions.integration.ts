/**
 * M25 - Playbook Actions Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { PlaybookAction, ActionFilters, ActionStatus } from '../types';

/**
 * Get actions for a playbook
 */
export async function getPlaybookActions(playbookId: string): Promise<PlaybookAction[]> {
  const { data, error } = await supabase
    .from('success_actions')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('sequence_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get all actions with filters
 */
export async function getActions(filters?: ActionFilters): Promise<PlaybookAction[]> {
  let query = supabase
    .from('success_actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  if (filters?.playbook_id) {
    query = query.eq('playbook_id', filters.playbook_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get actions assigned to current user
 */
export async function getMyActions(): Promise<PlaybookAction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  return getActions({ assigned_to: user.id });
}

/**
 * Create action
 */
export async function createAction(params: {
  playbook_id: string;
  sequence_order: number;
  action_type: string;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  action_config?: Record<string, any>;
  assigned_to?: string;
}): Promise<PlaybookAction> {
  const { data, error } = await supabase
    .from('success_actions')
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update action status
 */
export async function updateActionStatus(
  id: string,
  status: ActionStatus,
  notes?: string
): Promise<PlaybookAction> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const updates: any = { status };

  if (status === 'completed') {
    updates.completed_by = user?.id;
    updates.completed_at = new Date().toISOString();
    if (notes) {
      updates.completion_notes = notes;
    }
  }

  const { data, error } = await supabase
    .from('success_actions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Assign action to user
 */
export async function assignAction(
  id: string,
  userId: string
): Promise<PlaybookAction> {
  const { data, error } = await supabase
    .from('success_actions')
    .update({
      assigned_to: userId,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add evidence to action
 */
export async function addActionEvidence(
  id: string,
  evidenceUrl: string
): Promise<PlaybookAction> {
  const action = await getActions({ playbook_id: undefined });
  const currentAction = action.find(a => a.id === id);
  
  if (!currentAction) throw new Error('Action not found');

  const evidence_urls = [...(currentAction.evidence_urls || []), evidenceUrl];

  const { data, error } = await supabase
    .from('success_actions')
    .update({ evidence_urls })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete action
 */
export async function deleteAction(id: string): Promise<void> {
  const { error } = await supabase
    .from('success_actions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
