/**
 * M25 - Nudges Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { Nudge, NudgeFilters } from '../types';

/**
 * Get nudges for current user
 */
export async function getMyNudges(filters?: NudgeFilters): Promise<Nudge[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('success_nudges')
    .select('*')
    .eq('target_user_id', user.id)
    .order('created_at', { ascending: false });

  if (filters?.type?.length) {
    query = query.in('nudge_type', filters.type);
  }

  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority);
  }

  if (filters?.is_read !== undefined) {
    query = query.eq('is_read', filters.is_read);
  }

  if (filters?.is_dismissed !== undefined) {
    query = query.eq('is_dismissed', filters.is_dismissed);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get unread nudges count
 */
export async function getUnreadNudgesCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('success_nudges')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', user.id)
    .eq('is_read', false)
    .eq('is_dismissed', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark nudge as read
 */
export async function markNudgeAsRead(id: string): Promise<Nudge> {
  const { data, error } = await supabase
    .from('success_nudges')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Dismiss nudge
 */
export async function dismissNudge(id: string): Promise<Nudge> {
  const { data, error } = await supabase
    .from('success_nudges')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create nudge
 */
export async function createNudge(params: {
  nudge_type: string;
  title_ar: string;
  title_en?: string;
  message_ar: string;
  message_en?: string;
  target_user_id?: string;
  target_role?: string;
  priority?: string;
  delivery_channels?: string[];
  context_type?: string;
  context_id?: string;
  context_data?: Record<string, any>;
  action_url?: string;
  action_label_ar?: string;
  action_label_en?: string;
  expires_at?: string;
}): Promise<Nudge> {
  const { data, error } = await supabase
    .from('success_nudges')
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete nudge
 */
export async function deleteNudge(id: string): Promise<void> {
  const { error } = await supabase
    .from('success_nudges')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
