// Gate-I • Part 4B — Export Integration with Gate-F Reports Engine
// Gate-I • Part 4C — QA Hooks & Audit Logging for Awareness Insights
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  fetchAwarenessCampaignInsights,
  fetchAwarenessTimeseries,
  createReportExport
} from '@/modules/awareness/integration';
import { toCSV } from '@/lib/export/csv';
import type { ReportExportRequest } from '@/modules/analytics';
import { useAuditLog } from '@/lib/audit/log-event';

interface ExportFilters {
  campaignId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAwarenessExport() {
  const queryClient = useQueryClient();
  const { logAwarenessInsights } = useAuditLog();

  // Create report export mutation (for backend tracking)
  const createExportMutation = useMutation({
    mutationFn: createReportExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-exports'] });
      toast.success('Export completed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Export failed: ${error.message}`);
      // Gate-I • Part 4C — Log export errors
      console.error('[useAwarenessExport] Export failed:', error);
    },
  });

  // Export Campaign Insights
  const exportCampaignInsights = async (
    fileFormat: 'csv' | 'json',
    filters: ExportFilters
  ) => {
    try {
      const data = await fetchAwarenessCampaignInsights(
        filters.campaignId,
        filters.dateFrom,
        filters.dateTo
      );

      if (!data || data.length === 0) {
        toast.warning('No data available to export');
        // Gate-I • Part 4C — Log empty export attempt
        await logAwarenessInsights('awareness_insights.exported', 'campaign_insights', {
          export_type: 'campaign_insights',
          format: fileFormat,
          status: 'no_data',
          filters: {
            campaign_id: filters.campaignId,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
          },
        });
        return;
      }

      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const filename = `awareness_campaign_insights_${timestamp}.${fileFormat}`;

      if (fileFormat === 'csv') {
        const headers = {
          campaignId: 'Campaign ID',
          campaignName: 'Campaign Name',
          ownerName: 'Owner',
          totalParticipants: 'Total Participants',
          engagementRate: 'Engagement Rate (%)',
          completionRate: 'Completion Rate (%)',
          avgFeedbackScore: 'Avg Feedback Score',
          status: 'Status',
          startDate: 'Start Date',
          endDate: 'End Date',
        };
        
        const rows = data.map(d => ({
          campaignId: d.campaignId,
          campaignName: d.campaignName,
          ownerName: d.ownerName || 'N/A',
          totalParticipants: d.totalParticipants,
          engagementRate: (d.engagementRate * 100).toFixed(2),
          completionRate: (d.completionRate * 100).toFixed(2),
          avgFeedbackScore: d.avgFeedbackScore?.toFixed(2) || 'N/A',
          status: d.status,
          startDate: d.startDate,
          endDate: d.endDate,
        }));

        const csv = toCSV(rows, headers);
        downloadFile(csv, filename, 'text/csv');
      } else {
        // JSON format
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, filename, 'application/json');
      }

      // Track export in backend
      const request: ReportExportRequest = {
        reportType: 'awareness_campaign_insights',
        fileFormat,
        filters: {
          campaign: filters.campaignId,
          startDate: filters.dateFrom,
          endDate: filters.dateTo,
        },
      };
      createExportMutation.mutate(request);

      // Gate-I • Part 4C — Audit log successful export action
      await logAwarenessInsights('awareness_insights.exported', 'campaign_insights', {
        export_type: 'campaign_insights',
        format: fileFormat,
        status: 'success',
        filters: {
          campaign_id: filters.campaignId,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        },
        row_count: data.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Export failed: ${errorMessage}`);
      
      // Gate-I • Part 4C — Log export failure to audit system
      console.error('[exportCampaignInsights] Export failed:', error);
      await logAwarenessInsights('awareness_insights.exported', 'campaign_insights', {
        export_type: 'campaign_insights',
        format: fileFormat,
        status: 'failed',
        error_message: errorMessage,
        filters: {
          campaign_id: filters.campaignId,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        },
      });
    }
  };

  // Export Timeseries Insights
  const exportTimeseries = async (
    fileFormat: 'csv' | 'json',
    filters: ExportFilters
  ) => {
    try {
      const data = await fetchAwarenessTimeseries(
        filters.campaignId,
        filters.dateFrom,
        filters.dateTo
      );

      if (!data || data.length === 0) {
        toast.warning('No timeseries data available to export');
        // Gate-I • Part 4C — Log empty export attempt
        await logAwarenessInsights('awareness_insights.exported', 'timeseries_insights', {
          export_type: 'timeseries_insights',
          format: fileFormat,
          status: 'no_data',
          filters: {
            campaign_id: filters.campaignId,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
          },
        });
        return;
      }

      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const filename = `awareness_timeseries_${timestamp}.${fileFormat}`;

      if (fileFormat === 'csv') {
        const headers = {
          date: 'Date',
          campaignId: 'Campaign ID',
          engagementRate: 'Engagement Rate (%)',
          completionRate: 'Completion Rate (%)',
          activeParticipants: 'Active Participants',
        };
        
        const rows = data.map(d => ({
          date: d.date,
          campaignId: d.campaignId || 'All Campaigns',
          engagementRate: (d.engagementRate * 100).toFixed(2),
          completionRate: (d.completionRate * 100).toFixed(2),
          activeParticipants: d.activeParticipants,
        }));

        const csv = toCSV(rows, headers);
        downloadFile(csv, filename, 'text/csv');
      } else {
        // JSON format
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, filename, 'application/json');
      }

      // Track export in backend
      const request: ReportExportRequest = {
        reportType: 'awareness_timeseries',
        fileFormat,
        filters: {
          campaign: filters.campaignId,
          startDate: filters.dateFrom,
          endDate: filters.dateTo,
        },
      };
      createExportMutation.mutate(request);

      // Gate-I • Part 4C — Audit log successful export action
      await logAwarenessInsights('awareness_insights.exported', 'timeseries_insights', {
        export_type: 'timeseries_insights',
        format: fileFormat,
        status: 'success',
        filters: {
          campaign_id: filters.campaignId,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        },
        row_count: data.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Export failed: ${errorMessage}`);
      
      // Gate-I • Part 4C — Log export failure to audit system
      console.error('[exportTimeseries] Export failed:', error);
      await logAwarenessInsights('awareness_insights.exported', 'timeseries_insights', {
        export_type: 'timeseries_insights',
        format: fileFormat,
        status: 'failed',
        error_message: errorMessage,
        filters: {
          campaign_id: filters.campaignId,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        },
      });
    }
  };

  return {
    exportCampaignInsights,
    exportTimeseries,
    isExporting: createExportMutation.isPending,
  };
}

// Helper to trigger browser download
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
