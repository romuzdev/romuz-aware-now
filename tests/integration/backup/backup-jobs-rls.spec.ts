/**
 * ============================================================================
 * M23 - Backup Jobs RLS Integration Tests
 * Purpose: Verify tenant isolation and RLS policies for backup_jobs table
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  signInAsTenantA,
  signInAsTenantB,
  signOut,
  setupTestTenants,
  setupTestUsers,
  cleanupTestData,
  TEST_TENANTS,
  getUserTenantId,
} from '../../helpers/test-auth';
import {
  createTestBackupJob,
  deleteTestData,
} from '../../helpers/test-fixtures';

describe('Backup Jobs - RLS Policies', () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userA: any;
  let userB: any;

  beforeAll(async () => {
    // Setup test environment
    await setupTestTenants();
    await setupTestUsers();

    // Sign in as both tenants
    const resultA = await signInAsTenantA();
    clientA = resultA.client;
    userA = resultA.user;

    const resultB = await signInAsTenantB();
    clientB = resultB.client;
    userB = resultB.user;
  }, 30000); // 30 second timeout for setup

  afterAll(async () => {
    await cleanupTestData();
    await signOut(clientA);
    await signOut(clientB);
  });

  beforeEach(async () => {
    // Clean backup jobs before each test
    await cleanupTestData();
  });

  describe('Tenant Isolation', () => {
    it('should only return backup jobs for current tenant', async () => {
      // Create backup job for Tenant A
      const jobA = await createTestBackupJob(clientA, TEST_TENANTS[0].id);

      // Create backup job for Tenant B
      const jobB = await createTestBackupJob(clientB, TEST_TENANTS[1].id);

      // Query as Tenant A - should only see Tenant A jobs
      const { data: jobsA, error: errorA } = await clientA
        .from('backup_jobs')
        .select('*');

      expect(errorA).toBeNull();
      expect(jobsA).toBeDefined();
      expect(jobsA!.length).toBeGreaterThan(0);
      expect(jobsA!.every((job) => job.tenant_id === TEST_TENANTS[0].id)).toBe(true);

      // Query as Tenant B - should only see Tenant B jobs
      const { data: jobsB, error: errorB } = await clientB
        .from('backup_jobs')
        .select('*');

      expect(errorB).toBeNull();
      expect(jobsB).toBeDefined();
      expect(jobsB!.length).toBeGreaterThan(0);
      expect(jobsB!.every((job) => job.tenant_id === TEST_TENANTS[1].id)).toBe(true);

      // Cleanup
      await deleteTestData(clientA, 'backup_jobs', jobA.id);
      await deleteTestData(clientB, 'backup_jobs', jobB.id);
    });

    it('should not allow access to other tenant backup jobs', async () => {
      // Create backup job for Tenant B
      const jobB = await createTestBackupJob(clientB, TEST_TENANTS[1].id);

      // Try to query Tenant B jobs as Tenant A
      const { data: jobs, error } = await clientA
        .from('backup_jobs')
        .select('*')
        .eq('tenant_id', TEST_TENANTS[1].id);

      expect(error).toBeNull();
      expect(jobs).toHaveLength(0); // RLS should filter out Tenant B jobs

      // Cleanup
      await deleteTestData(clientB, 'backup_jobs', jobB.id);
    });
  });

  describe('CRUD Operations', () => {
    it('should allow creating backup job for own tenant', async () => {
      const tenantId = await getUserTenantId(clientA);
      expect(tenantId).toBe(TEST_TENANTS[0].id);

      const { data, error } = await clientA
        .from('backup_jobs')
        .insert({
          tenant_id: tenantId!,
          backup_name: 'test_backup_create',
          job_type: 'full',
          status: 'pending',
          created_by: userA.id,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.tenant_id).toBe(tenantId);

      // Cleanup
      await deleteTestData(clientA, 'backup_jobs', data!.id);
    });

    it('should not allow creating backup job for other tenant', async () => {
      const { data, error } = await clientA
        .from('backup_jobs')
        .insert({
          tenant_id: TEST_TENANTS[1].id, // Try to create for Tenant B
          backup_name: 'test_backup_cross_tenant',
          job_type: 'full',
          status: 'pending',
          created_by: userA.id,
        })
        .select()
        .single();

      // Should fail due to RLS policy
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('should allow updating own tenant backup job', async () => {
      const job = await createTestBackupJob(clientA, TEST_TENANTS[0].id);

      const { data, error } = await clientA
        .from('backup_jobs')
        .update({ status: 'completed' })
        .eq('id', job.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.status).toBe('completed');

      // Cleanup
      await deleteTestData(clientA, 'backup_jobs', job.id);
    });

    it('should allow deleting own tenant backup job', async () => {
      const job = await createTestBackupJob(clientA, TEST_TENANTS[0].id);

      const { error } = await clientA
        .from('backup_jobs')
        .delete()
        .eq('id', job.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: deleted } = await clientA
        .from('backup_jobs')
        .select('*')
        .eq('id', job.id);

      expect(deleted).toHaveLength(0);
    });
  });

  describe('Data Integrity', () => {
    it('should enforce NOT NULL constraints on required fields', async () => {
      const { data, error } = await clientA
        .from('backup_jobs')
        .insert({
          tenant_id: TEST_TENANTS[0].id,
          // Missing required fields
        })
        .select();

      expect(error).toBeDefined();
      expect(error!.message).toContain('null');
    });

    it('should validate job_type enum', async () => {
      const { data, error } = await clientA
        .from('backup_jobs')
        .insert({
          tenant_id: TEST_TENANTS[0].id,
          backup_name: 'test_invalid_type',
          job_type: 'invalid_type', // Invalid
          status: 'pending',
          created_by: userA.id,
        })
        .select();

      expect(error).toBeDefined();
    });

    it('should validate status enum', async () => {
      const { data, error } = await clientA
        .from('backup_jobs')
        .insert({
          tenant_id: TEST_TENANTS[0].id,
          backup_name: 'test_invalid_status',
          job_type: 'full',
          status: 'invalid_status', // Invalid
          created_by: userA.id,
        })
        .select();

      expect(error).toBeDefined();
    });
  });
});
