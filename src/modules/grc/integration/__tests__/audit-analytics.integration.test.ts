/**
 * Audit Analytics Integration Tests
 * Unit tests for audit analytics integration functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  getAuditCompletionRate,
  getFindingsSeverityDistribution,
  getAvgFindingClosureTime,
  getWorkflowProgressSummary,
  getAuditTrends,
  getComplianceGaps,
} from '../audit-analytics.integration';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Audit Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditCompletionRate', () => {
    it('should return completion rate data', async () => {
      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      // Mock user_tenants
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { tenant_id: 'tenant-123' },
          error: null,
        }),
      } as any);

      // Mock RPC call
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [{
          completed_audits: 8,
          total_audits: 10,
          completion_rate: 80,
        }],
        error: null,
      } as any);

      const result = await getAuditCompletionRate('2024-01-01', '2024-12-31');

      expect(result).toEqual({
        completed_audits: 8,
        total_audits: 10,
        completion_rate: 80,
      });
      expect(supabase.rpc).toHaveBeenCalledWith('get_audit_completion_rate', {
        p_tenant_id: 'tenant-123',
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31',
      });
    });

    it('should throw error if not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        getAuditCompletionRate('2024-01-01', '2024-12-31')
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('getFindingsSeverityDistribution', () => {
    it('should return severity distribution', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { tenant_id: 'tenant-123' },
          error: null,
        }),
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { severity: 'critical', count: 5, percentage: 25 },
          { severity: 'high', count: 10, percentage: 50 },
          { severity: 'medium', count: 3, percentage: 15 },
          { severity: 'low', count: 2, percentage: 10 },
        ],
        error: null,
      } as any);

      const result = await getFindingsSeverityDistribution();

      expect(result).toHaveLength(4);
      expect(result[0].severity).toBe('critical');
      expect(result[0].count).toBe(5);
    });
  });

  describe('getAvgFindingClosureTime', () => {
    it('should return closure time statistics', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { tenant_id: 'tenant-123' },
          error: null,
        }),
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [{
          avg_days: 15.5,
          median_days: 12.0,
          min_days: 3,
          max_days: 45,
        }],
        error: null,
      } as any);

      const result = await getAvgFindingClosureTime();

      expect(result.avg_days).toBe(15.5);
      expect(result.median_days).toBe(12.0);
      expect(result.min_days).toBe(3);
      expect(result.max_days).toBe(45);
    });
  });

  describe('getWorkflowProgressSummary', () => {
    it('should return workflow progress', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [{
          total_stages: 5,
          completed_stages: 3,
          in_progress_stages: 1,
          pending_stages: 1,
          progress_percentage: 60,
        }],
        error: null,
      } as any);

      const result = await getWorkflowProgressSummary('workflow-123');

      expect(result.total_stages).toBe(5);
      expect(result.completed_stages).toBe(3);
      expect(result.progress_percentage).toBe(60);
    });
  });

  describe('getAuditTrends', () => {
    it('should return audit trends grouped by month', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { created_at: '2024-01-15', audit_status: 'closed' },
            { created_at: '2024-01-20', audit_status: 'in_progress' },
            { created_at: '2024-02-10', audit_status: 'closed' },
          ],
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: { tenant_id: 'tenant-123' },
          error: null,
        }),
      } as any);

      const result = await getAuditTrends(6);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getComplianceGaps', () => {
    it('should return compliance gaps by framework', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { framework_id: 'iso27001', audit_rating: 'satisfactory' },
            { framework_id: 'iso27001', audit_rating: 'needs_improvement' },
            { framework_id: 'nist', audit_rating: 'satisfactory' },
          ],
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: { tenant_id: 'tenant-123' },
          error: null,
        }),
      } as any);

      const result = await getComplianceGaps();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('framework');
        expect(result[0]).toHaveProperty('compliance_rate');
      }
    });
  });
});
