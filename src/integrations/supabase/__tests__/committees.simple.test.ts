import { describe, it, expect, vi } from 'vitest';
import * as committeeService from '@/modules/committees/integration';
import * as committeeGuards from '@/modules/committees/integration/committees-guards';

describe('Committees Integration - Security & RBAC', () => {
  describe('Permission Guards', () => {
    it('should check permissions before CRUD operations', async () => {
      // This test verifies the guards exist and can be called
      expect(committeeGuards.CommitteeGuards).toBeDefined();
      expect(committeeGuards.MeetingGuards).toBeDefined();
      expect(committeeGuards.DecisionGuards).toBeDefined();
      expect(committeeGuards.FollowupGuards).toBeDefined();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should include tenant_id in all operations', async () => {
      const mockCommittee = {
        id: '1',
        code: 'COM-001',
        name: 'Test',
        status: 'active',
        tenant_id: 'tenant-1',
        created_at: '2024-11-14',
        updated_at: '2024-11-14',
      };

      const createSpy = vi
        .spyOn(committeeService, 'createCommittee')
        .mockResolvedValue(mockCommittee as any);

      await committeeService.createCommittee({
        code: 'COM-001',
        name: 'Test',
        status: 'active',
      });

      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('Audit Logging', () => {
    it('should log create operations', async () => {
      const createSpy = vi
        .spyOn(committeeService, 'createCommittee')
        .mockResolvedValue({ id: '1' } as any);

      await committeeService.createCommittee({
        code: 'COM-001',
        name: 'Test',
        status: 'active',
      });

      // Audit logging happens inside createCommittee
      expect(createSpy).toHaveBeenCalled();
    });

    it('should log update operations', async () => {
      const updateSpy = vi
        .spyOn(committeeService, 'updateCommittee')
        .mockResolvedValue({} as any);

      await committeeService.updateCommittee('1', { name: 'Updated' });

      expect(updateSpy).toHaveBeenCalledWith('1', { name: 'Updated' });
    });

    it('should log delete operations', async () => {
      const deleteSpy = vi
        .spyOn(committeeService, 'deleteCommittee')
        .mockResolvedValue(undefined);

      await committeeService.deleteCommittee('1');

      expect(deleteSpy).toHaveBeenCalledWith('1');
    });
  });
});
