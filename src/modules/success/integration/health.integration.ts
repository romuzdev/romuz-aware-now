/**
 * M25 - Health Score Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { HealthSnapshot } from '../types';

/**
 * Get current health snapshot for tenant
 */
export async function getCurrentHealthSnapshot(): Promise<HealthSnapshot | null> {
  const { data, error } = await supabase
    .from('success_health_snapshots')
    .select('*')
    .is('org_unit_id', null)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get health trend (last N days)
 */
export async function getHealthTrend(days: number = 30): Promise<HealthSnapshot[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data, error } = await supabase
    .from('success_health_snapshots')
    .select('*')
    .is('org_unit_id', null)
    .gte('snapshot_date', fromDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get health snapshots for org unit
 */
export async function getOrgUnitHealthSnapshots(
  orgUnitId: string,
  days: number = 30
): Promise<HealthSnapshot[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data, error } = await supabase
    .from('success_health_snapshots')
    .select('*')
    .eq('org_unit_id', orgUnitId)
    .gte('snapshot_date', fromDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Trigger health score recomputation (via Edge Function)
 */
export async function recomputeHealthScore(): Promise<HealthSnapshot> {
  const { data, error } = await supabase.functions.invoke('success-health-compute', {
    body: { action: 'recompute' },
  });

  if (error) throw error;
  return data;
}
