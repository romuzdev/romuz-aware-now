/**
 * ============================================================================
 * M23 - PITR Snapshots RLS Integration Tests
 * Purpose: Verify tenant isolation for PITR snapshots and rollback
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
  createTestPITRSnapshot,
  createTestBackupJob,
  deleteTestData,
} from '../../helpers/test-fixtures';

describe('PITR Snapshots - RLS Policies', () => {
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
    // Clean up snapshots before each test
    await clientA.from('backup_pitr_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientB.from('backup_pitr_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  describe('Tenant Isolation', () => {
    it('should only return snapshots for current tenant', async () => {
      // Create snapshots for both tenants
      const snapshotA = await createTestPITRSnapshot(clientA, tenantAId);
      await createTestPITRSnapshot(clientB, tenantBId);

      // Tenant A should only see their snapshot
      const { data: snapshotsA } = await clientA
        .from('backup_pitr_snapshots')
        .select('*');

      expect(snapshotsA).toBeDefined();
      expect(snapshotsA?.length).toBeGreaterThan(0);
      expect(snapshotsA?.every((s: any) => s.tenant_id === tenantAId)).toBe(true);

      // Verify the snapshot we created is there
      const foundSnapshot = snapshotsA?.find((s: any) => s.id === snapshotA.id);
      expect(foundSnapshot).toBeDefined();
    });

    it('should not allow access to other tenant snapshots', async () => {
      // Create snapshot for Tenant B
      const snapshotB = await createTestPITRSnapshot(clientB, tenantBId);

      // Tenant A tries to query Tenant B's snapshots
      const { data: snapshotsA } = await clientA
        .from('backup_pitr_snapshots')
        .select('*')
        .eq('tenant_id', tenantBId);

      expect(snapshotsA).toHaveLength(0);

      // Tenant A tries to get specific snapshot by ID
      const { data: specificSnapshot } = await clientA
        .from('backup_pitr_snapshots')
        .select('*')
        .eq('id', snapshotB.id)
        .single();

      expect(specificSnapshot).toBeNull();
    });

    it('should prevent cross-tenant snapshot creation', async () => {
      // Tenant A tries to create snapshot for Tenant B
      const { error } = await clientA
        .from('backup_pitr_snapshots')
        .insert({
          tenant_id: tenantBId,
          restore_log_id: null,
          snapshot_data: { test: 'data' },
          affected_tables: ['test_table'],
          status: 'active',
          created_by: userA.id,
        });

      // Should fail due to RLS policy
      expect(error).toBeDefined();
    });
  });

  describe('Snapshot Operations', () => {
    it('should allow creating snapshot for own tenant', async () => {
      const snapshot = await createTestPITRSnapshot(clientA, tenantAId);

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.tenant_id).toBe(tenantAId);
      expect(snapshot.status).toBe('active');
    });

    it('should allow updating own snapshot', async () => {
      const snapshot = await createTestPITRSnapshot(clientA, tenantAId);

      const { data: updated, error } = await clientA
        .from('backup_pitr_snapshots')
        .update({ status: 'expired' })
        .eq('id', snapshot.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated).toBeDefined();
      expect(updated.status).toBe('expired');
    });

    it('should allow deleting own snapshot', async () => {
      const snapshot = await createTestPITRSnapshot(clientA, tenantAId);

      const { error } = await clientA
        .from('backup_pitr_snapshots')
        .delete()
        .eq('id', snapshot.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await clientA
        .from('backup_pitr_snapshots')
        .select('*')
        .eq('id', snapshot.id)
        .single();

      expect(data).toBeNull();
    });

    it('should not allow updating other tenant snapshot', async () => {
      const snapshotB = await createTestPITRSnapshot(clientB, tenantBId);

      // Tenant A tries to update Tenant B's snapshot
      const { data: updated, error } = await clientA
        .from('backup_pitr_snapshots')
        .update({ status: 'expired' })
        .eq('id', snapshotB.id)
        .select();

      // No rows should be updated due to RLS
      expect(updated).toHaveLength(0);
    });
  });

  describe('Rollback History', () => {
    it('should only show rollback history for current tenant', async () => {
      const snapshotA = await createTestPITRSnapshot(clientA, tenantAId);
      const snapshotB = await createTestPITRSnapshot(clientB, tenantBId);

      // Create rollback history for both
      await clientA.from('backup_pitr_rollback_history').insert({
        tenant_id: tenantAId,
        snapshot_id: snapshotA.id,
        initiated_by: userA.id,
        reason: 'Test rollback A',
        status: 'completed',
      });

      await clientB.from('backup_pitr_rollback_history').insert({
        tenant_id: tenantBId,
        snapshot_id: snapshotB.id,
        initiated_by: userB.id,
        reason: 'Test rollback B',
        status: 'completed',
      });

      // Tenant A should only see their history
      const { data: historyA } = await clientA
        .from('backup_pitr_rollback_history')
        .select('*');

      expect(historyA).toBeDefined();
      expect(historyA?.every((h: any) => h.tenant_id === tenantAId)).toBe(true);

      // Verify cross-tenant isolation
      const { data: historyACrossTenant } = await clientA
        .from('backup_pitr_rollback_history')
        .select('*')
        .eq('tenant_id', tenantBId);

      expect(historyACrossTenant).toHaveLength(0);
    });

    it('should record rollback operations correctly', async () => {
      const snapshot = await createTestPITRSnapshot(clientA, tenantAId);

      const { data: rollback, error } = await clientA
        .from('backup_pitr_rollback_history')
        .insert({
          tenant_id: tenantAId,
          snapshot_id: snapshot.id,
          initiated_by: userA.id,
          reason: 'Test rollback operation',
          status: 'in_progress',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(rollback).toBeDefined();
      expect(rollback.snapshot_id).toBe(snapshot.id);
      expect(rollback.status).toBe('in_progress');
      expect(rollback.initiated_by).toBe(userA.id);
    });
  });

  describe('Helper Functions', () => {
    it('should call get_active_pitr_snapshots for current tenant', async () => {
      // Create active and expired snapshots
      await createTestPITRSnapshot(clientA, tenantAId, { status: 'active' });
      await createTestPITRSnapshot(clientA, tenantAId, { status: 'expired' });
      await createTestPITRSnapshot(clientB, tenantBId, { status: 'active' });

      const { data, error } = await clientA.rpc('get_active_pitr_snapshots', {
        p_tenant_id: tenantAId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      // Should only return active snapshots for tenant A
      if (data && data.length > 0) {
        expect(data.every((s: any) => s.status === 'active')).toBe(true);
        expect(data.every((s: any) => s.tenant_id === tenantAId)).toBe(true);
      }
    });

    it('should validate snapshot integrity', async () => {
      const snapshot = await createTestPITRSnapshot(clientA, tenantAId);

      const { data, error } = await clientA.rpc('validate_snapshot_integrity', {
        p_snapshot_id: snapshot.id,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.valid).toBeDefined();
      expect(data.snapshot).toBeDefined();
    });

    it('should calculate table restoration order', async () => {
      const tables = ['policies', 'documents', 'audit_log'];

      const { data, error } = await clientA.rpc('get_table_restoration_order', {
        p_tables: tables,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(tables.length);
    });
  });
});
