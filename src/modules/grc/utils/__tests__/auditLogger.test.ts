/**
 * Audit Logger Unit Tests
 * 🟢 Low Priority: Unit tests for audit logger utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  logAuditAction,
  logWorkflowCreated,
  logWorkflowUpdated,
  logWorkflowAssigned,
  logWorkflowCompleted,
  logFindingCreated,
  logFindingUpdated,
  AUDIT_ENTITY_TYPES,
  AUDIT_ACTIONS,
} from '../auditLogger';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Audit Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Suppress console warnings for tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('logAuditAction', () => {
    it('should log an audit action successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockTenant = { tenant_id: 'tenant-1' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      const mockInsertQuery = {
        insert: vi.fn(),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      mockTenantQuery.single.mockResolvedValue({ data: mockTenant, error: null });
      mockInsertQuery.insert.mockResolvedValue({ error: null });

      await logAuditAction(
        AUDIT_ENTITY_TYPES.WORKFLOW,
        'wf-123',
        AUDIT_ACTIONS.CREATE,
        { workflow_type: 'planning' }
      );

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: AUDIT_ENTITY_TYPES.WORKFLOW,
          entity_id: 'wf-123',
          action: AUDIT_ACTIONS.CREATE,
          actor: 'user-123',
          tenant_id: 'tenant-1',
        })
      );
    });

    it('should handle missing user gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await logAuditAction(
        AUDIT_ENTITY_TYPES.WORKFLOW,
        'wf-123',
        AUDIT_ACTIONS.CREATE
      );

      expect(console.warn).toHaveBeenCalledWith('Cannot log audit action: No authenticated user');
    });

    it('should handle missing tenant gracefully', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockTenantQuery as any);
      mockTenantQuery.single.mockResolvedValue({ data: null, error: null });

      await logAuditAction(
        AUDIT_ENTITY_TYPES.WORKFLOW,
        'wf-123',
        AUDIT_ACTIONS.CREATE
      );

      expect(console.warn).toHaveBeenCalledWith('Cannot log audit action: No tenant found for user');
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockTenant = { tenant_id: 'tenant-1' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      const mockInsertQuery = {
        insert: vi.fn(),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      mockTenantQuery.single.mockResolvedValue({ data: mockTenant, error: null });
      mockInsertQuery.insert.mockResolvedValue({ error: new Error('Database error') });

      await logAuditAction(
        AUDIT_ENTITY_TYPES.WORKFLOW,
        'wf-123',
        AUDIT_ACTIONS.CREATE
      );

      expect(console.error).toHaveBeenCalledWith('Failed to log audit action:', expect.any(Error));
    });
  });

  describe('Convenience logging functions', () => {
    beforeEach(() => {
      // Mock successful auth and tenant
      const mockUser = { id: 'user-123' };
      const mockTenant = { tenant_id: 'tenant-1' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      const mockInsertQuery = {
        insert: vi.fn(),
      };

      vi.mocked(supabase.from)
        .mockReturnValue(mockTenantQuery as any)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      mockTenantQuery.single.mockResolvedValue({ data: mockTenant, error: null });
      mockInsertQuery.insert.mockResolvedValue({ error: null });
    });

    it('should log workflow creation', async () => {
      await logWorkflowCreated('wf-123', 'audit-456', 'planning');

      expect(supabase.from).toHaveBeenCalledWith('audit_log');
    });

    it('should log workflow update', async () => {
      await logWorkflowUpdated('wf-123', { status: 'completed' });

      expect(supabase.from).toHaveBeenCalledWith('audit_log');
    });

    it('should log workflow assignment', async () => {
      await logWorkflowAssigned('wf-123', 'user-456');

      expect(supabase.from).toHaveBeenCalledWith('audit_log');
    });

    it('should log workflow completion', async () => {
      await logWorkflowCompleted('wf-123', 'Completed successfully');

      expect(supabase.from).toHaveBeenCalledWith('audit_log');
    });

    it('should log finding creation', async () => {
      await logFindingCreated('finding-123', 'audit-456', 'high');

      expect(supabase.from).toHaveBeenCalledWith('audit_log');
    });

    it('should log finding update', async () => {
      await logFindingUpdated('finding-123', { status: 'resolved' });

      expect(supabase.from).toHaveBeenCalledWith('audit_log');
    });
  });
});
