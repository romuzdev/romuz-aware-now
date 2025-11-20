/**
 * GRC Reports Hooks
 * React Query hooks for report generation and management
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  generateRiskSummaryReport,
  generateHeatMapData,
  generateRiskTrendAnalysis,
  generateControlPerformanceReport,
  exportReport,
} from '../integration/reports.integration';
import type {
  ReportConfig,
  ReportData,
  ExportOptions,
} from '../types/report.types';

/**
 * Hook to generate risk summary report
 */
export const useGenerateRiskSummary = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (config: ReportConfig) => generateRiskSummaryReport(config),
    onSuccess: () => {
      toast({
        title: 'تم إنشاء التقرير',
        description: 'تم إنشاء تقرير ملخص المخاطر بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في إنشاء التقرير',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to get heat map data
 */
export const useHeatMapData = () => {
  return useQuery({
    queryKey: ['grc', 'reports', 'heatmap'],
    queryFn: generateHeatMapData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to generate risk trend analysis
 */
export const useRiskTrendAnalysis = (
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  months: number = 6
) => {
  return useQuery({
    queryKey: ['grc', 'reports', 'trends', period, months],
    queryFn: () => generateRiskTrendAnalysis(period, months),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to generate control performance report
 */
export const useControlPerformanceReport = () => {
  return useQuery({
    queryKey: ['grc', 'reports', 'control-performance'],
    queryFn: generateControlPerformanceReport,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to export report
 */
export const useExportReport = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      reportData, 
      options 
    }: { 
      reportData: ReportData; 
      options: ExportOptions;
    }) => exportReport(reportData, options),
    onSuccess: (blob, { options }) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.fileName || `report.${options.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'تم تصدير التقرير',
        description: `تم تصدير التقرير بصيغة ${options.format.toUpperCase()} بنجاح`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في تصدير التقرير',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to generate and download report
 */
export const useGenerateAndExportReport = () => {
  const generateReport = useGenerateRiskSummary();
  const exportReport = useExportReport();

  return async (config: ReportConfig, exportOptions: ExportOptions) => {
    try {
      const reportData = await generateReport.mutateAsync(config);
      await exportReport.mutateAsync({ reportData, options: exportOptions });
    } catch (error) {
      console.error('Error generating and exporting report:', error);
    }
  };
};
