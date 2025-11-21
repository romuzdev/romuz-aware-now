/**
 * Audit Analytics Hooks Tests
 * Integration tests for React Query hooks
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAuditCompletionRate,
  useFindingsSeverityDistribution,
  useAvgFindingClosureTime,
  useWorkflowProgressSummary,
  useAuditTrends,
  useAuditComplianceGaps,
} from '../useAuditAnalytics';
import * as analyticsIntegration from '../../integration/audit-analytics.integration';

// Mock integration functions
vi.mock('../../integration/audit-analytics.integration');

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Audit Analytics Hooks', () => {
  describe('useAuditCompletionRate', () => {
    it('should fetch completion rate data', async () => {
      const mockData = {
        completed_audits: 8,
        total_audits: 10,
        completion_rate: 80,
      };

      vi.mocked(analyticsIntegration.getAuditCompletionRate).mockResolvedValue(mockData);

      const { result } = renderHook(
        () => useAuditCompletionRate('2024-01-01', '2024-12-31'),
        { wrapper: createWrapper() }
      );

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useFindingsSeverityDistribution', () => {
    it('should fetch severity distribution', async () => {
      const mockData = [
        { severity: 'critical', count: 5, percentage: 25 },
        { severity: 'high', count: 10, percentage: 50 },
      ];

      vi.mocked(analyticsIntegration.getFindingsSeverityDistribution).mockResolvedValue(mockData);

      const { result } = renderHook(
        () => useFindingsSeverityDistribution(),
        { wrapper: createWrapper() }
      );

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useAvgFindingClosureTime', () => {
    it('should fetch closure time statistics', async () => {
      const mockData = {
        avg_days: 15.5,
        median_days: 12.0,
        min_days: 3,
        max_days: 45,
      };

      vi.mocked(analyticsIntegration.getAvgFindingClosureTime).mockResolvedValue(mockData);

      const { result } = renderHook(
        () => useAvgFindingClosureTime(),
        { wrapper: createWrapper() }
      );

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
      expect(result.current.data?.avg_days).toBe(15.5);
    });
  });
});
