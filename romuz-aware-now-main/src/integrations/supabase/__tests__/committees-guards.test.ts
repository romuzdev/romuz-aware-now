import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CommitteeGuards,
  MeetingGuards,
  DecisionGuards,
  FollowupGuards,
} from '@/modules/committees/integration/committees-guards';
import * as rbac from '@/core/rbac';

vi.mock('../rbac', () => ({
  fetchMyRoles: vi.fn(),
  rolesHavePermission: vi.fn(),
}));

describe('Committee Guards - Server-Side RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CommitteeGuards', () => {
    it('should allow read when user has committee.read permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_admin', permissions: ['committee.read'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canRead = await CommitteeGuards.canRead();

      expect(canRead).toBe(true);
    });

    it('should deny read when user lacks committee.read permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_employee', permissions: [] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(false);

      const canRead = await CommitteeGuards.canRead();

      expect(canRead).toBe(false);
    });

    it('should throw error when requireRead fails', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([]);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(false);

      await expect(CommitteeGuards.requireRead()).rejects.toThrow(
        'Missing permission: committee.read'
      );
    });

    it('should allow write when user has committee.write permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_admin', permissions: ['committee.write'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canWrite = await CommitteeGuards.canWrite();

      expect(canWrite).toBe(true);
    });

    it('should allow manage when user has committee.manage permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_admin', permissions: ['committee.manage'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canManage = await CommitteeGuards.canManage();

      expect(canManage).toBe(true);
    });

    it('should allow delete when user has committee.delete permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_admin', permissions: ['committee.delete'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canDelete = await CommitteeGuards.canDelete();

      expect(canDelete).toBe(true);
    });
  });

  describe('MeetingGuards', () => {
    it('should allow create when user has meeting.create permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_manager', permissions: ['meeting.create'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canCreate = await MeetingGuards.canCreate();

      expect(canCreate).toBe(true);
    });

    it('should deny create when user lacks meeting.create permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([]);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(false);

      const canCreate = await MeetingGuards.canCreate();

      expect(canCreate).toBe(false);
    });

    it('should throw error when requireManage fails', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([]);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(false);

      await expect(MeetingGuards.requireManage()).rejects.toThrow(
        'Missing permission: meeting.manage'
      );
    });

    it('should allow close when user has meeting.close permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_admin', permissions: ['meeting.close'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canClose = await MeetingGuards.canClose();

      expect(canClose).toBe(true);
    });
  });

  describe('DecisionGuards', () => {
    it('should allow create when user has decision.create permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_manager', permissions: ['decision.create'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canCreate = await DecisionGuards.canCreate();

      expect(canCreate).toBe(true);
    });

    it('should throw error when requireCreate fails', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([]);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(false);

      await expect(DecisionGuards.requireCreate()).rejects.toThrow(
        'Missing permission: decision.create'
      );
    });
  });

  describe('FollowupGuards', () => {
    it('should allow manage when user has followup.manage permission', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([
        { role: 'tenant_manager', permissions: ['followup.manage'] },
      ] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      const canManage = await FollowupGuards.canManage();

      expect(canManage).toBe(true);
    });

    it('should throw error when requireManage fails', async () => {
      vi.spyOn(rbac, 'fetchMyRoles').mockResolvedValue([]);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(false);

      await expect(FollowupGuards.requireManage()).rejects.toThrow(
        'Missing permission: followup.manage'
      );
    });
  });

  describe('Permission Caching', () => {
    it('should call fetchMyRoles for permission checks', async () => {
      const fetchSpy = vi
        .spyOn(rbac, 'fetchMyRoles')
        .mockResolvedValue([{ role: 'tenant_admin' }] as any);
      vi.spyOn(rbac, 'rolesHavePermission').mockReturnValue(true);

      await CommitteeGuards.canRead();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
