/**
 * Audit Analytics Hooks
 * React Query hooks for advanced audit analytics
 */

import { useQuery } from '@tanstack/react-query';
import {
  getAuditCompletionRate,
  getFindingsSeverityDistribution,
  getAvgFindingClosureTime,
  getWorkflowProgressSummary,
  getAuditTrends,
  getComplianceGaps,
} from '../integration/audit-analytics.integration';

/**
 * Hook to get audit completion rate for a date range
 */
export function useAuditCompletionRate(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['grc', 'audit-analytics', 'completion-rate', startDate, endDate],
    queryFn: () => getAuditCompletionRate(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get findings severity distribution
 */
export function useFindingsSeverityDistribution(auditId?: string) {
  return useQuery({
    queryKey: ['grc', 'audit-analytics', 'severity-distribution', auditId],
    queryFn: () => getFindingsSeverityDistribution(auditId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get average finding closure time
 */
export function useAvgFindingClosureTime(auditId?: string) {
  return useQuery({
    queryKey: ['grc', 'audit-analytics', 'closure-time', auditId],
    queryFn: () => getAvgFindingClosureTime(auditId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get workflow progress summary
 */
export function useWorkflowProgressSummary(workflowId: string) {
  return useQuery({
    queryKey: ['grc', 'audit-analytics', 'workflow-progress', workflowId],
    queryFn: () => getWorkflowProgressSummary(workflowId),
    enabled: !!workflowId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get audit trends over time
 */
export function useAuditTrends(months: number = 6) {
  return useQuery({
    queryKey: ['grc', 'audit-analytics', 'trends', months],
    queryFn: () => getAuditTrends(months),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get compliance gap analysis for audits
 */
export function useAuditComplianceGaps() {
  return useQuery({
    queryKey: ['grc', 'audit-analytics', 'compliance-gaps'],
    queryFn: () => getComplianceGaps(),
    staleTime: 10 * 60 * 1000,
  });
}
