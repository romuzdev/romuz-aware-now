/**
 * GRC Report Export Hook
 * Hook for exporting reports in various formats
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportReport } from '../utils/export.utils';
import type { ReportData, ExportOptions } from '../types/report.types';

interface UseReportExportProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useReportExport(props?: UseReportExportProps) {
  const mutation = useMutation({
    mutationFn: async ({
      reportData,
      options,
    }: {
      reportData: ReportData;
      options: ExportOptions;
    }) => {
      return exportReport(reportData, options);
    },
    onSuccess: () => {
      toast.success('تم تصدير التقرير بنجاح');
      props?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('❌ Export error:', error);
      toast.error(error.message || 'فشل تصدير التقرير');
      props?.onError?.(error);
    },
  });

  return {
    exportReport: mutation.mutate,
    isExporting: mutation.isPending,
    error: mutation.error,
  };
}
