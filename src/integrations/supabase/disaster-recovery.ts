/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Integration: Disaster Recovery Management
 * ============================================================================
 */

import { supabase } from './client';

// ============================================================================
// Types
// ============================================================================

export interface DisasterRecoveryPlan {
  id: string;
  tenant_id: string;
  plan_name: string;
  description?: string;
  rto_minutes: number;
  rpo_minutes: number;
  backup_frequency: string;
  retention_days: number;
  backup_types: string[];
  test_frequency: string;
  next_test_date?: string;
  last_test_date?: string;
  last_test_status?: string;
  notification_emails: string[];
  alert_on_failure: boolean;
  alert_on_test_due: boolean;
  is_active: boolean;
  priority: string;
  metadata?: any;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by?: string;
}

export interface RecoveryTest {
  id: string;
  tenant_id: string;
  dr_plan_id?: string;
  backup_job_id?: string;
  test_name: string;
  test_type: string;
  test_status: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  validation_results?: any;
  data_integrity_check?: boolean;
  performance_metrics?: any;
  issues_found: number;
  issues_details?: any[];
  tables_tested?: string[];
  records_validated: number;
  notes?: string;
  recommendations?: string;
  test_log_path?: string;
  report_path?: string;
  metadata?: any;
  created_at: string;
  created_by: string;
}

export interface HealthSnapshot {
  id: string;
  tenant_id: string;
  checked_at: string;
  health_status: string;
  health_score: number;
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  last_backup_at?: string;
  next_scheduled_backup?: string;
  total_storage_bytes: number;
  storage_growth_rate?: number;
  storage_utilization_pct?: number;
  avg_backup_duration_seconds?: number;
  avg_restore_duration_seconds?: number;
  last_successful_restore_at?: string;
  rto_compliance_pct?: number;
  rpo_compliance_pct?: number;
  retention_compliance_pct?: number;
  active_issues?: any[];
  warnings?: any[];
  recommendations?: string[];
  metadata?: any;
  created_at: string;
}

// ============================================================================
// DR Plans
// ============================================================================

export async function fetchDRPlans(tenantId: string): Promise<DisasterRecoveryPlan[]> {
  const { data, error } = await supabase
    .from('backup_disaster_recovery_plans')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createDRPlan(
  plan: Omit<DisasterRecoveryPlan, 'id' | 'created_at' | 'updated_at'>
): Promise<DisasterRecoveryPlan> {
  const { data, error } = await supabase
    .from('backup_disaster_recovery_plans')
    .insert(plan)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDRPlan(
  id: string,
  updates: Partial<DisasterRecoveryPlan>
): Promise<DisasterRecoveryPlan> {
  const { data, error } = await supabase
    .from('backup_disaster_recovery_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDRPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('backup_disaster_recovery_plans')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getDRPlanCompliance(planId: string): Promise<any> {
  const { data, error } = await supabase.rpc('get_dr_plan_compliance', {
    p_dr_plan_id: planId,
  });

  if (error) throw error;
  return data;
}

// ============================================================================
// Recovery Tests
// ============================================================================

export async function fetchRecoveryTests(
  tenantId: string,
  drPlanId?: string
): Promise<RecoveryTest[]> {
  let query = supabase
    .from('backup_recovery_tests')
    .select('*')
    .eq('tenant_id', tenantId);

  if (drPlanId) {
    query = query.eq('dr_plan_id', drPlanId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function executeRecoveryTest(params: {
  dr_plan_id?: string;
  backup_job_id?: string;
  test_name: string;
  test_type: 'manual' | 'automated' | 'scheduled';
  validation_level: 'basic' | 'full' | 'deep';
}): Promise<any> {
  const { data, error } = await supabase.functions.invoke('backup-recovery-test', {
    body: params,
  });

  if (error) throw error;
  return data;
}

export async function getRecoveryTest(testId: string): Promise<RecoveryTest> {
  const { data, error } = await supabase
    .from('backup_recovery_tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Health Monitoring
// ============================================================================

export async function fetchHealthSnapshots(
  tenantId: string,
  limit = 30
): Promise<HealthSnapshot[]> {
  const { data, error } = await supabase
    .from('backup_health_monitoring')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getLatestHealthSnapshot(
  tenantId: string
): Promise<HealthSnapshot | null> {
  const { data, error } = await supabase
    .from('backup_health_monitoring')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function triggerHealthMonitoring(): Promise<any> {
  const { data, error } = await supabase.functions.invoke('backup-health-monitor', {
    body: {},
  });

  if (error) throw error;
  return data;
}

export async function calculateHealthScore(tenantId: string): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_backup_health_score', {
    p_tenant_id: tenantId,
  });

  if (error) throw error;
  return data || 0;
}

// ============================================================================
// Statistics & Reports
// ============================================================================

export async function getDRStatistics(tenantId: string): Promise<any> {
  const [drPlans, tests, health] = await Promise.all([
    fetchDRPlans(tenantId),
    fetchRecoveryTests(tenantId),
    getLatestHealthSnapshot(tenantId),
  ]);

  const activePlans = drPlans.filter(p => p.is_active);
  const passedTests = tests.filter(t => t.test_status === 'passed');
  const failedTests = tests.filter(t => t.test_status === 'failed');
  const recentTests = tests.filter(
    t => new Date(t.created_at) > new Date(Date.now() - 30 * 86400000)
  );

  return {
    total_plans: drPlans.length,
    active_plans: activePlans.length,
    total_tests: tests.length,
    passed_tests: passedTests.length,
    failed_tests: failedTests.length,
    recent_tests: recentTests.length,
    test_success_rate:
      tests.length > 0 ? (passedTests.length / tests.length) * 100 : 0,
    health_score: health?.health_score || 0,
    health_status: health?.health_status || 'unknown',
    last_health_check: health?.checked_at,
  };
}
