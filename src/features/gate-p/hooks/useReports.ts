// Gate-F: Reports Hook
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ReportFilters, ReportExportRequest } from '@/modules/analytics';
import {
  fetchReportExports,
  fetchReportKPIsDaily,
  fetchReportKPIsCTD,
  createReportExport,
  deleteReportExport,
  refreshReportViews,
} from '@/modules/awareness/integration';

export function useReports() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: undefined,
    endDate: undefined,
    campaign: undefined,
  });

  const queryClient = useQueryClient();

  // Fetch exports
  const exportsQuery = useQuery({
    queryKey: ['report-exports'],
    queryFn: fetchReportExports,
  });

  // Fetch daily KPIs
  const dailyKPIsQuery = useQuery({
    queryKey: ['report-kpis-daily', filters],
    queryFn: () => fetchReportKPIsDaily(filters.campaign, filters.startDate, filters.endDate),
  });

  // Fetch CTD KPIs
  const ctdKPIsQuery = useQuery({
    queryKey: ['report-kpis-ctd', filters.campaign],
    queryFn: () => fetchReportKPIsCTD(filters.campaign),
  });

  // Create export mutation
  const createExportMutation = useMutation({
    mutationFn: createReportExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-exports'] });
      toast.success('Export request created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create export: ${error.message}`);
    },
  });

  // Delete export mutation
  const deleteExportMutation = useMutation({
    mutationFn: deleteReportExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-exports'] });
      toast.success('Export deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete export: ${error.message}`);
    },
  });

  // Refresh views mutation
  const refreshMutation = useMutation({
    mutationFn: refreshReportViews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-kpis-daily'] });
      queryClient.invalidateQueries({ queryKey: ['report-kpis-ctd'] });
      toast.success('Data refreshed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to refresh: ${error.message}`);
    },
  });

  // Export report helper
  const exportReport = (
    reportType: 'performance' | 'deliverability' | 'engagement',
    fileFormat: 'csv' | 'json' | 'xlsx'
  ) => {
    const request: ReportExportRequest = {
      reportType,
      fileFormat,
      filters,
    };
    createExportMutation.mutate(request);
  };

  const data = useMemo(() => {
    const kpis = dailyKPIsQuery.data ?? [];
    
    return {
      columns: [
        { header: 'Date', accessorKey: 'date' },
        { header: 'Campaign', accessorKey: 'campaignName' },
        { header: 'Deliveries', accessorKey: 'deliveries' },
        { header: 'Opens', accessorKey: 'opens' },
        { header: 'Clicks', accessorKey: 'clicks' },
        { header: 'Open Rate', accessorKey: 'openRateFormatted' },
        { header: 'Click Rate', accessorKey: 'ctrFormatted' },
      ],
      rows: kpis.map(k => ({
        date: k.date,
        campaignName: k.campaignName,
        deliveries: k.deliveries.toLocaleString('en'),
        opens: k.opens.toLocaleString('en'),
        clicks: k.clicks.toLocaleString('en'),
        openRateFormatted: `${(k.openRate * 100).toFixed(1)}%`,
        ctrFormatted: `${(k.ctr * 100).toFixed(1)}%`,
      })),
    };
  }, [dailyKPIsQuery.data]);

  return {
    // Data for DataTable
    data,
    
    // Raw data
    exports: exportsQuery.data ?? [],
    dailyKPIs: dailyKPIsQuery.data ?? [],
    ctdKPIs: ctdKPIsQuery.data ?? [],
    
    // Loading states
    isLoading: exportsQuery.isLoading || dailyKPIsQuery.isLoading || ctdKPIsQuery.isLoading,
    
    // Filters
    filters,
    setFilters: (newFilters: Partial<ReportFilters>) => setFilters({ ...filters, ...newFilters }),
    
    // Actions
    exportReport,
    deleteExport: deleteExportMutation.mutate,
    refreshViews: refreshMutation.mutate,
    
    // Mutations
    isExporting: createExportMutation.isPending,
    isDeleting: deleteExportMutation.isPending,
    isRefreshing: refreshMutation.isPending,
  };
}
