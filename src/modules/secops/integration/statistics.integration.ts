/**
 * SecOps Statistics Integration Layer
 * M18.5 - SecOps Integration
 */

import { supabase } from '@/integrations/supabase/client';
import type { SecOpsStatistics } from '../types';

/**
 * Fetch SecOps statistics for dashboard
 */
export async function fetchSecOpsStatistics(): Promise<SecOpsStatistics | null> {
  const { data, error } = await supabase
    .from('vw_secops_statistics')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to fetch SecOps statistics:', error);
    return null;
  }

  return data as SecOpsStatistics;
}

/**
 * Get real-time event stream
 */
export function subscribeToSecurityEvents(
  callback: (event: any) => void
) {
  return supabase
    .channel('security_events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events',
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

/**
 * Get real-time playbook execution updates
 */
export function subscribeToExecutions(
  callback: (execution: any) => void
) {
  return supabase
    .channel('soar_executions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'soar_executions',
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}
