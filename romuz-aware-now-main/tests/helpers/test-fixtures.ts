/**
 * ============================================================================
 * M23 - Test Data Fixtures
 * Purpose: Reusable test data for integration tests
 * ============================================================================
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create test backup job
 */
export async function createTestBackupJob(
  client: SupabaseClient,
  tenantId: string,
  overrides?: Partial<any>
): Promise<any> {
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const backupJob = {
    tenant_id: tenantId,
    backup_name: `test_backup_${Date.now()}`,
    job_type: 'full',
    status: 'pending',
    created_by: user.id,
    ...overrides,
  };

  const { data, error } = await client
    .from('backup_jobs')
    .insert(backupJob)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create backup job: ${error.message}`);
  }

  return data;
}

/**
 * Create test DR plan
 */
export async function createTestDRPlan(
  client: SupabaseClient,
  tenantId: string,
  overrides?: Partial<any>
): Promise<any> {
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const drPlan = {
    tenant_id: tenantId,
    plan_name: `test_dr_plan_${Date.now()}`,
    description: 'Test disaster recovery plan',
    rto_minutes: 60,
    rpo_minutes: 30,
    backup_frequency: 'daily',
    backup_types: ['full', 'incremental'],
    retention_days: 30,
    test_frequency: 'monthly',
    is_active: true,
    created_by: user.id,
    ...overrides,
  };

  const { data, error } = await client
    .from('backup_disaster_recovery_plans')
    .insert(drPlan)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create DR plan: ${error.message}`);
  }

  return data;
}

/**
 * Create test PITR snapshot
 */
export async function createTestPITRSnapshot(
  client: SupabaseClient,
  tenantId: string,
  overrides?: Partial<any>
): Promise<any> {
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const snapshot = {
    tenant_id: tenantId,
    snapshot_name: `test_snapshot_${Date.now()}`,
    snapshot_type: 'pre_restore',
    created_by: user.id,
    affected_tables: ['test_table1', 'test_table2'],
    snapshot_data: { test: 'data' },
    total_rows_count: 100,
    is_rolled_back: false,
    status: 'active',
    ...overrides,
  };

  const { data, error } = await client
    .from('backup_pitr_snapshots')
    .insert(snapshot)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create PITR snapshot: ${error.message}`);
  }

  return data;
}

/**
 * Create test recovery test
 */
export async function createTestRecoveryTest(
  client: SupabaseClient,
  tenantId: string,
  drPlanId: string,
  overrides?: Partial<any>
): Promise<any> {
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const recoveryTest = {
    tenant_id: tenantId,
    dr_plan_id: drPlanId,
    test_name: `test_recovery_${Date.now()}`,
    test_type: 'manual',
    test_status: 'completed',
    created_by: user.id,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: 300,
    issues_found: 0,
    data_integrity_check: true,
    ...overrides,
  };

  const { data, error } = await client
    .from('backup_recovery_tests')
    .insert(recoveryTest)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create recovery test: ${error.message}`);
  }

  return data;
}

/**
 * Create test health snapshot
 */
export async function createTestHealthSnapshot(
  client: SupabaseClient,
  tenantId: string,
  overrides?: Partial<any>
): Promise<any> {
  const healthSnapshot = {
    tenant_id: tenantId,
    health_status: 'healthy',
    health_score: 95,
    checked_at: new Date().toISOString(),
    total_backups: 10,
    successful_backups: 9,
    failed_backups: 1,
    ...overrides,
  };

  const { data, error } = await client
    .from('backup_health_monitoring')
    .insert(healthSnapshot)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create health snapshot: ${error.message}`);
  }

  return data;
}

/**
 * Create complete test backup scenario
 */
export async function createBackupScenario(
  client: SupabaseClient,
  tenantId: string
): Promise<{
  backupJob: any;
  drPlan: any;
  recoveryTest: any;
  healthSnapshot: any;
}> {
  const backupJob = await createTestBackupJob(client, tenantId, {
    status: 'completed',
    backup_size_bytes: 1024 * 1024 * 100, // 100 MB
    duration_seconds: 120,
  });

  const drPlan = await createTestDRPlan(client, tenantId);

  const recoveryTest = await createTestRecoveryTest(client, tenantId, drPlan.id);

  const healthSnapshot = await createTestHealthSnapshot(client, tenantId);

  return {
    backupJob,
    drPlan,
    recoveryTest,
    healthSnapshot,
  };
}

/**
 * Delete test data by ID
 */
export async function deleteTestData(
  client: SupabaseClient,
  table: string,
  id: string
): Promise<void> {
  const { error } = await client
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    console.warn(`Failed to delete test data from ${table}:`, error.message);
  }
}
