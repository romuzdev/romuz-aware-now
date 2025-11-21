/**
 * Audit Workflows Integration Tests
 * 🔴 High Priority: Integration testing for workflow management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  getAuditWorkflows,
  getAuditWorkflowById,
  createAuditWorkflow,
  updateAuditWorkflow,
  assignWorkflow,
  completeWorkflow,
  getWorkflowStatistics,
} from '../audit-workflows.integration';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock audit logger
vi.mock('../../utils/auditLogger', () => ({
  logWorkflowCreated: vi.fn(),
  logWorkflowUpdated: vi.fn(),
  logWorkflowAssigned: vi.fn(),
  logWorkflowCompleted: vi.fn(),
  logStageUpdated: vi.fn(),
}));

describe('Audit Workflows Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditWorkflows', () => {
    it('should fetch workflows with filters', async () => {
      const mockWorkflows = [
        {
          id: 'wf-1',
          audit_id: 'audit-1',
          workflow_type: 'planning',
          status: 'in_progress',
          created_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.order.mockResolvedValue({ data: mockWorkflows, error: null });

      const result = await getAuditWorkflows({ audit_id: 'audit-1' });

      expect(supabase.from).toHaveBeenCalledWith('audit_workflows');
      expect(mockQuery.eq).toHaveBeenCalledWith('audit_id', 'audit-1');
      expect(result).toEqual(mockWorkflows);
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.order.mockResolvedValue({ data: null, error: new Error('Database error') });

      await expect(getAuditWorkflows()).rejects.toThrow('Database error');
    });
  });

  describe('getAuditWorkflowById', () => {
    it('should fetch a single workflow', async () => {
      const mockWorkflow = {
        id: 'wf-1',
        audit_id: 'audit-1',
        workflow_type: 'planning',
        status: 'in_progress',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockWorkflow, error: null });

      const result = await getAuditWorkflowById('wf-1');

      expect(supabase.from).toHaveBeenCalledWith('audit_workflows');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'wf-1');
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('createAuditWorkflow', () => {
    it('should create a new workflow and log the action', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockTenant = { tenant_id: 'tenant-1' };
      const mockWorkflow = {
        id: 'wf-new',
        audit_id: 'audit-1',
        workflow_type: 'planning',
        tenant_id: 'tenant-1',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn(),
      };

      const mockWorkflowQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockWorkflowQuery as any);

      mockTenantQuery.limit.mockResolvedValue({ data: [mockTenant], error: null });
      mockWorkflowQuery.single.mockResolvedValue({ data: mockWorkflow, error: null });

      const result = await createAuditWorkflow({
        audit_id: 'audit-1',
        workflow_type: 'planning',
        current_stage: 'not_started',
      });

      expect(result).toEqual(mockWorkflow);
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('should throw error if no tenant found', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockTenantQuery as any);
      mockTenantQuery.limit.mockResolvedValue({ data: [], error: null });

      await expect(
        createAuditWorkflow({
          audit_id: 'audit-1',
          workflow_type: 'planning',
          current_stage: 'not_started',
        })
      ).rejects.toThrow('لا يمكن إنشاء سير عمل بدون سياق المستأجر');
    });
  });

  describe('updateAuditWorkflow', () => {
    it('should update a workflow and log the action', async () => {
      const mockUser = { id: 'user-123' };
      const mockUpdatedWorkflow = {
        id: 'wf-1',
        status: 'completed',
        progress_pct: 100,
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockUpdatedWorkflow, error: null });

      const result = await updateAuditWorkflow({
        workflow_id: 'wf-1',
        status: 'completed',
        progress_pct: 100,
      });

      expect(result).toEqual(mockUpdatedWorkflow);
      expect(mockQuery.update).toHaveBeenCalled();
    });
  });

  describe('assignWorkflow', () => {
    it('should assign workflow to user and log the action', async () => {
      const mockUser = { id: 'user-123' };
      const mockAssignedWorkflow = {
        id: 'wf-1',
        assigned_to: 'user-456',
        status: 'in_progress',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockAssignedWorkflow, error: null });

      const result = await assignWorkflow('wf-1', 'user-456');

      expect(result).toEqual(mockAssignedWorkflow);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          assigned_to: 'user-456',
          status: 'in_progress',
        })
      );
    });
  });

  describe('completeWorkflow', () => {
    it('should complete workflow and log the action', async () => {
      const mockUser = { id: 'user-123' };
      const mockCompletedWorkflow = {
        id: 'wf-1',
        status: 'completed',
        progress_pct: 100,
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockCompletedWorkflow, error: null });

      const result = await completeWorkflow('wf-1', 'Completed successfully');

      expect(result).toEqual(mockCompletedWorkflow);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          progress_pct: 100,
        })
      );
    });
  });

  describe('getWorkflowStatistics', () => {
    it('should calculate workflow statistics', async () => {
      const mockWorkflows = [
        { workflow_type: 'planning', status: 'completed', created_at: '2024-01-01', completed_date: '2024-01-10' },
        { workflow_type: 'planning', status: 'in_progress', created_at: '2024-01-05', completed_date: null },
        { workflow_type: 'execution', status: 'completed', created_at: '2024-01-01', completed_date: '2024-01-15' },
        { workflow_type: 'execution', status: 'pending', created_at: '2024-01-08', completed_date: null },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.eq.mockResolvedValue({ data: mockWorkflows, error: null });

      const result = await getWorkflowStatistics('audit-1');

      expect(result.total_workflows).toBe(4);
      expect(result.completed_workflows).toBe(2);
      expect(result.in_progress_workflows).toBe(1);
      expect(result.pending_workflows).toBe(1);
      expect(result.avg_completion_days).toBeGreaterThan(0);
    });

    it('should handle empty workflow list', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.select.mockResolvedValue({ data: [], error: null });

      const result = await getWorkflowStatistics();

      expect(result.total_workflows).toBe(0);
      expect(result.avg_completion_days).toBe(0);
    });
  });
});
