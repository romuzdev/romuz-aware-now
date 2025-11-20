/**
 * Import/Export Hook
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * React hook for import/export operations with progress tracking
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  exportData,
  importData,
  getImportExportHistory,
  type ExportOptions,
  type ImportOptions,
} from '@/core/services/importExportService';
import { useQuery } from '@tanstack/react-query';

export function useImportExport(module_name: string) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch job history
  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['import-export-history', module_name],
    queryFn: () => getImportExportHistory({ module_name, limit: 50 }),
  });

  /**
   * Export data
   */
  const doExport = async (
    options: Omit<ExportOptions, 'module_name'>,
    dataFetchFn: () => Promise<any[]>
  ) => {
    setIsExporting(true);

    try {
      const result = await exportData(
        { ...options, module_name },
        dataFetchFn
      );

      // Trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = `${options.entity_type}_export_${Date.now()}.${options.file_format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'تم التصدير بنجاح',
        description: `تم تصدير البيانات بصيغة ${options.file_format.toUpperCase()}`,
      });

      refetchHistory();

      return result;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل التصدير',
        description: error.message,
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Import data
   */
  const doImport = async (
    options: Omit<ImportOptions, 'module_name'>,
    dataImportFn: (data: any[]) => Promise<void>
  ) => {
    setIsImporting(true);

    try {
      const result = await importData(
        { ...options, module_name },
        dataImportFn
      );

      toast({
        title: 'تم الاستيراد بنجاح',
        description: `تم استيراد ${result.success_rows} سجل`,
      });

      refetchHistory();

      return result;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل الاستيراد',
        description: error.message,
      });
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    doExport,
    doImport,
    isExporting,
    isImporting,
    history: history || [],
    refetchHistory,
  };
}
