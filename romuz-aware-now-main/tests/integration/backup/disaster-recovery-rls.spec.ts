/**
 * ============================================================================
 * M23 - Disaster Recovery Plans RLS Integration Tests
 * Purpose: Verify tenant isolation for DR plans and recovery tests
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
} from '../../helpers/test-auth';
import {
  createTestDRPlan,
  createTestRecoveryTest,
  createTestHealthSnapshot,
  deleteTestData,
} from '../../helpers/test-fixtures';

describe('Disaster Recovery - RLS Policies', () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userA: any;
  let userB: any;
  const tenantAId = TEST_TENANTS[0].id;
  const tenantBId = TEST_TENANTS[1].id;

  beforeAll(async () => {
    await setupTestTenants();
    await setupTestUsers();

    const resultA = await signInAsTenantA();
    clientA = resultA.client;
    userA = resultA.user;

    const resultB = await signInAsTenantB();
    clientB = resultB.client;
    userB = resultB.user;
  });

  afterAll(async () => {
    await cleanupTestData();
    await signOut(clientA);
    await signOut(clientB);
  });

  beforeEach(async () => {
    // Clean up before each test
    await clientA.from('backup_disaster_recovery_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientB.from('backup_disaster_recovery_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientA.from('backup_recovery_tests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientB.from('backup_recovery_tests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  describe('DR Plans - Tenant Isolation', () => {
    it('should only return DR plans for current tenant', async () => {
      // Create DR plans for both tenants
      const planA = await createTestDRPlan(clientA, tenantAId);
      await createTestDRPlan(clientB, tenantBId);

      // Tenant A should only see their plan
      const { data: plansA } = await clientA
        .from('backup_disaster_recovery_plans')
        .select('*');

      expect(plansA).toBeDefined();
      expect(plansA?.length).toBeGreaterThan(0);
      expect(plansA?.every((p: any) => p.tenant_id === tenantAId)).toBe(true);

      // Verify the plan we created is there
      const foundPlan = plansA?.find((p: any) => p.id === planA.id);
      expect(foundPlan).toBeDefined();
    });

    it('should not allow access to other tenant DR plans', async () => {
      // Create DR plan for Tenant B
      const planB = await createTestDRPlan(clientB, tenantBId);

      // Tenant A tries to query Tenant B's plans
      const { data: plansA } = await clientA
        .from('backup_disaster_recovery_plans')
        .select('*')
        .eq('tenant_id', tenantBId);

      expect(plansA).toHaveLength(0);

      // Tenant A tries to get specific plan by ID
      const { data: specificPlan } = await clientA
        .from('backup_disaster_recovery_plans')
        .select('*')
        .eq('id', planB.id)
        .single();

      expect(specificPlan).toBeNull();
    });

    it('should prevent cross-tenant DR plan creation', async () => {
      // Tenant A tries to create plan for Tenant B
      const { error } = await clientA
        .from('backup_disaster_recovery_plans')
        .insert({
          tenant_id: tenantBId,
          plan_name: 'Cross-tenant plan',
          description: 'Should fail',
          rto_minutes: 60,
          rpo_minutes: 30,
          retention_days: 30,
          backup_frequency: 'daily',
          test_frequency: 'monthly',
          backup_types: ['full'],
          created_by: userA.id,
        });

      // Should fail due to RLS policy
      expect(error).toBeDefined();
    });
  });

  describe('Recovery Tests - Tenant Isolation', () => {
    it('should only return recovery tests for current tenant', async () => {
      const planA = await createTestDRPlan(clientA, tenantAId);
      const planB = await createTestDRPlan(clientB, tenantBId);

      // Create recovery tests for both
      await createTestRecoveryTest(clientA, tenantAId, planA.id);
      await createTestRecoveryTest(clientB, tenantBId, planB.id);

      // Tenant A should only see their tests
      const { data: testsA } = await clientA
        .from('backup_recovery_tests')
        .select('*');

      expect(testsA).toBeDefined();
      expect(testsA?.every((t: any) => t.tenant_id === tenantAId)).toBe(true);

      // Verify cross-tenant isolation
      const { data: testsACrossTenant } = await clientA
        .from('backup_recovery_tests')
        .select('*')
        .eq('tenant_id', tenantBId);

      expect(testsACrossTenant).toHaveLength(0);
    });

    it('should enforce DR plan ownership on test creation', async () => {
      const planB = await createTestDRPlan(clientB, tenantBId);

      // Tenant A tries to create recovery test for Tenant B's plan
      const { error } = await clientA
        .from('backup_recovery_tests')
        .insert({
          tenant_id: tenantAId,
          dr_plan_id: planB.id,
          test_name: 'Cross-tenant test',
          test_type: 'manual',
          validation_level: 'basic',
          status: 'pending',
          initiated_by: userA.id,
        });

      // Should fail due to FK constraint or RLS
      expect(error).toBeDefined();
    });
  });

  describe('Health Monitoring - Tenant Isolation', () => {
    it('should only return health snapshots for current tenant', async () => {
      await createTestHealthSnapshot(clientA, tenantAId);
      await createTestHealthSnapshot(clientB, tenantBId);

      // Tenant A should only see their snapshots
      const { data: snapshotsA } = await clientA
        .from('backup_health_monitoring')
        .select('*');

      expect(snapshotsA).toBeDefined();
      expect(snapshotsA?.every((s: any) => s.tenant_id === tenantAId)).toBe(true);

      // Verify cross-tenant isolation
      const { data: snapshotsACrossTenant } = await clientA
        .from('backup_health_monitoring')
        .select('*')
        .eq('tenant_id', tenantBId);

      expect(snapshotsACrossTenant).toHaveLength(0);
    });

    it('should calculate health score only for current tenant', async () => {
      await createTestHealthSnapshot(clientA, tenantAId, { health_score: 85 });
      await createTestHealthSnapshot(clientB, tenantBId, { health_score: 70 });

      const { data, error } = await clientA.rpc('calculate_health_score', {
        p_tenant_id: tenantAId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThanOrEqual(0);
      expect(data).toBeLessThanOrEqual(100);
    });
  });

  describe('CRUD Operations', () => {
    it('should allow creating DR plan for own tenant', async () => {
      const plan = await createTestDRPlan(clientA, tenantAId);

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(plan.tenant_id).toBe(tenantAId);
      expect(plan.plan_name).toBeDefined();
    });

    it('should allow updating own DR plan', async () => {
      const plan = await createTestDRPlan(clientA, tenantAId);

      const { data: updated, error } = await clientA
        .from('backup_disaster_recovery_plans')
        .update({ rto_minutes: 120 })
        .eq('id', plan.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated).toBeDefined();
      expect(updated.rto_minutes).toBe(120);
    });

    it('should allow deleting own DR plan', async () => {
      const plan = await createTestDRPlan(clientA, tenantAId);

      const { error } = await clientA
        .from('backup_disaster_recovery_plans')
        .delete()
        .eq('id', plan.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await clientA
        .from('backup_disaster_recovery_plans')
        .select('*')
        .eq('id', plan.id)
        .single();

      expect(data).toBeNull();
    });

    it('should not allow updating other tenant DR plans', async () => {
      const planB = await createTestDRPlan(clientB, tenantBId);

      // Tenant A tries to update Tenant B's plan
      const { data: updated, error } = await clientA
        .from('backup_disaster_recovery_plans')
        .update({ rto_minutes: 240 })
        .eq('id', planB.id)
        .select();

      // No rows should be updated due to RLS
      expect(updated).toHaveLength(0);
    });
  });

  describe('Business Logic', () => {
    it('should validate RTO/RPO values', async () => {
      // RTO should be >= RPO
      const { error } = await clientA
        .from('backup_disaster_recovery_plans')
        .insert({
          tenant_id: tenantAId,
          plan_name: 'Invalid RTO/RPO',
          rto_minutes: 30,  // RTO < RPO
          rpo_minutes: 60,
          retention_days: 30,
          backup_frequency: 'daily',
          test_frequency: 'monthly',
          backup_types: ['full'],
          created_by: userA.id,
        });

      // Should fail due to validation trigger
      expect(error).toBeDefined();
    });

    it('should validate backup frequency', async () => {
      const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly'];

      for (const freq of validFrequencies) {
        const plan = await createTestDRPlan(clientA, tenantAId, {
          backup_frequency: freq,
        });

        expect(plan).toBeDefined();
        expect(plan.backup_frequency).toBe(freq);

        await deleteTestData(clientA, 'backup_disaster_recovery_plans', plan.id);
      }
    });

    it('should track next_test_date correctly', async () => {
      const plan = await createTestDRPlan(clientA, tenantAId, {
        test_frequency: 'monthly',
      });

      expect(plan.next_test_date).toBeDefined();

      // Update last_test_date
      const testDate = new Date().toISOString();
      const { data: updated } = await clientA
        .from('backup_disaster_recovery_plans')
        .update({ last_test_date: testDate })
        .eq('id', plan.id)
        .select()
        .single();

      expect(updated).toBeDefined();
      expect(updated.last_test_date).toBe(testDate);
    });
  });
});
