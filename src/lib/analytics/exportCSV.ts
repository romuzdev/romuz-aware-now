import type { CampaignKPI, TopBottomCampaign } from '@/modules/campaigns';
import { format } from 'date-fns';

/**
 * Export KPI data to CSV
 */
export function exportKPIsToCSV(
  aggregated: {
    totalParticipants: number;
    started: number;
    completed: number;
    avgScore: number | null;
    overdue: number;
    completionRate: number | null;
  },
  filters: {
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `awareness_kpis_${timestamp}.csv`;

  const headers = [
    'Metric',
    'Value',
    'Date From',
    'Date To',
    'Generated At',
  ].join(',');

  const rows = [
    ['Total Participants', aggregated.totalParticipants],
    ['Started', aggregated.started],
    ['Completed', aggregated.completed],
    [
      'Completion Rate',
      aggregated.completionRate !== null
        ? `${aggregated.completionRate.toFixed(2)}%`
        : 'N/A',
    ],
    [
      'Avg Score',
      aggregated.avgScore !== null
        ? `${aggregated.avgScore.toFixed(2)}%`
        : 'N/A',
    ],
    ['Overdue', aggregated.overdue],
  ].map((row) =>
    [
      row[0],
      row[1],
      filters.dateFrom || '',
      filters.dateTo || '',
      new Date().toISOString(),
    ].join(',')
  );

  const csv = [headers, ...rows].join('\n');
  downloadCSV(csv, filename);
}

/**
 * Export Top/Bottom campaigns to CSV
 */
export function exportCampaignsToCSV(
  campaigns: TopBottomCampaign[],
  type: 'top' | 'bottom'
) {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `awareness_${type}_${timestamp}.csv`;

  const headers = [
    'Campaign ID',
    'Campaign Name',
    'Owner',
    'Total Participants',
    'Completion Rate',
    'Avg Score',
    'Generated At',
  ].join(',');

  const rows = campaigns.map((c) =>
    [
      c.campaign_id,
      `"${c.campaign_name}"`,
      c.owner_name || 'N/A',
      c.total_participants,
      c.completion_rate !== null ? `${c.completion_rate.toFixed(2)}%` : 'N/A',
      c.avg_score !== null ? `${c.avg_score.toFixed(2)}%` : 'N/A',
      new Date().toISOString(),
    ].join(',')
  );

  const csv = [headers, ...rows].join('\n');
  downloadCSV(csv, filename);
}

/**
 * Helper to trigger browser download
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
