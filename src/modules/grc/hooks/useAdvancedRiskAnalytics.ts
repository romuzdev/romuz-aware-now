/**
 * Advanced Risk Analytics Hooks
 * Phase 3: GRC Enhancement
 */

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchRiskHeatMap,
  fetchRiskTrends,
  analyzeRiskCorrelations,
  calculatePredictiveRiskScores,
  exportRiskAnalytics,
} from '../integration/advanced-risk-analytics.integration';
import { useState } from 'react';

export function useRiskHeatMap() {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['risk-heat-map', tenantId],
    queryFn: () => fetchRiskHeatMap(tenantId!),
    enabled: !!tenantId,
  });
}

export function useRiskTrends(periodDays: number = 90) {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['risk-trends', tenantId, periodDays],
    queryFn: () => fetchRiskTrends(tenantId!, periodDays),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRiskCorrelations() {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['risk-correlations', tenantId],
    queryFn: () => analyzeRiskCorrelations(tenantId!),
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePredictiveRiskScores() {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['predictive-risk-scores', tenantId],
    queryFn: () => calculatePredictiveRiskScores(tenantId!),
    enabled: !!tenantId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useRiskAnalyticsExport() {
  const { tenantId } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  
  const exportAnalytics = async (format: 'csv' | 'pdf' | 'xlsx' = 'csv') => {
    if (!tenantId) return;
    
    setIsExporting(true);
    try {
      const blob = await exportRiskAnalytics(tenantId, format);
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setIsExporting(false);
    }
  };
  
  return { exportAnalytics, isExporting };
}
