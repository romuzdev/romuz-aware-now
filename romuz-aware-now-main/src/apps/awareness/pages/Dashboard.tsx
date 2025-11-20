import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/core/components/ui/button';
import { Download, FileDown } from 'lucide-react';
import { useCan } from '@/core/rbac';
import { AwarenessFiltersBar } from '@/modules/analytics/components/AwarenessFiltersBar';
import { AwarenessKPICards } from '@/modules/analytics/components/AwarenessKPICards';
import { AwarenessTrendChart } from '@/modules/analytics/components/AwarenessTrendChart';
import { TopBottomCampaignsTable } from '@/modules/analytics/components/TopBottomCampaignsTable';
import { useAwarenessKPIs } from '@/modules/analytics/hooks/useAwarenessKPIs';
import { useAwarenessTrend } from '@/modules/analytics/hooks/useAwarenessTrend';
import { useAwarenessTopLists } from '@/modules/analytics/hooks/useAwarenessTopLists';
import { useCampaignsList } from '@/modules/campaigns';
import { getDateRangeFromPreset } from '@/lib/analytics/dateRangePresets';
import { exportKPIsToCSV, exportCampaignsToCSV } from '@/lib/analytics/exportCSV';
import type { AwarenessFilters } from '@/modules/campaigns';
import { useToast } from '@/hooks/use-toast';

export default function AwarenessDashboard() {
  const { t } = useTranslation();
  const can = useCan();
  const { toast } = useToast();

  useEffect(() => {
    document.title = `${t('awareness.dashboard.title')} | Romuz`;
  }, [t]);

  const [filters, setFilters] = useState<AwarenessFilters>({
    dateRange: '30d',
    status: 'all',
  });

  // Compute actual date range
  const actualFilters = useMemo(() => {
    const dateRange =
      filters.dateRange === 'custom'
        ? { dateFrom: filters.dateFrom, dateTo: filters.dateTo }
        : getDateRangeFromPreset(filters.dateRange);

    return {
      ...filters,
      ...dateRange,
    };
  }, [filters]);

  // Fetch campaigns for dropdown
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useCampaignsList({
    page: 1,
    filters: {
      q: '',
      status: 'all',
      from: '',
      to: '',
      owner: '',
      includeArchived: false,
      pageSize: 1000,
      sortBy: 'created_at',
      sortDir: 'desc',
    },
  });

  // Fetch analytics data
  const {
    data: kpisData,
    isLoading: isLoadingKPIs,
    error: kpisError,
  } = useAwarenessKPIs(actualFilters);

  const {
    data: trendData,
    isLoading: isLoadingTrend,
    error: trendError,
  } = useAwarenessTrend(actualFilters);

  const {
    data: topBottomData,
    isLoading: isLoadingTopBottom,
    error: topBottomError,
  } = useAwarenessTopLists(actualFilters);

  // Export handlers
  const handleExportKPIs = () => {
    if (!kpisData?.aggregated) {
      toast({
        title: 'No Data',
        description: 'No KPI data available to export',
        variant: 'destructive',
      });
      return;
    }

    exportKPIsToCSV(kpisData.aggregated, {
      dateFrom: actualFilters.dateFrom,
      dateTo: actualFilters.dateTo,
    });

    toast({
      title: 'Export Complete',
      description: 'KPIs exported successfully',
    });
  };

  const handleExportTop = () => {
    if (!topBottomData?.top || topBottomData.top.length === 0) {
      toast({
        title: 'No Data',
        description: 'No top campaigns available to export',
        variant: 'destructive',
      });
      return;
    }

    exportCampaignsToCSV(topBottomData.top, 'top');

    toast({
      title: 'Export Complete',
      description: 'Top campaigns exported successfully',
    });
  };

  const handleExportBottom = () => {
    if (!topBottomData?.bottom || topBottomData.bottom.length === 0) {
      toast({
        title: 'No Data',
        description: 'No bottom campaigns available to export',
        variant: 'destructive',
      });
      return;
    }

    exportCampaignsToCSV(topBottomData.bottom, 'bottom');

    toast({
      title: 'Export Complete',
      description: 'Bottom campaigns exported successfully',
    });
  };

  const canExport = can('campaigns.manage');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('awareness.dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('awareness.dashboard.description')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportKPIs}
            disabled={!canExport || isLoadingKPIs}
            title={!canExport ? 'Requires campaigns.manage permission' : ''}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('awareness.dashboard.exportKPIs')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AwarenessFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        campaigns={campaignsData || []}
        isLoadingCampaigns={isLoadingCampaigns}
      />

      {/* KPI Cards */}
      <AwarenessKPICards
        data={kpisData?.aggregated}
        isLoading={isLoadingKPIs}
      />

      {/* Trend Chart */}
      <AwarenessTrendChart data={trendData} isLoading={isLoadingTrend} />

      {/* Top/Bottom Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('awareness.dashboard.topCampaigns')}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTop}
              disabled={!canExport || isLoadingTopBottom}
              title={!canExport ? 'Requires campaigns.manage permission' : ''}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {t('common.export')}
            </Button>
          </div>
          <TopBottomCampaignsTable
            title={t('awareness.dashboard.topPerforming')}
            data={topBottomData?.top}
            isLoading={isLoadingTopBottom}
            filters={{
              dateFrom: actualFilters.dateFrom,
              dateTo: actualFilters.dateTo,
              status: actualFilters.status,
            }}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('awareness.dashboard.bottomCampaigns')}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBottom}
              disabled={!canExport || isLoadingTopBottom}
              title={!canExport ? 'Requires campaigns.manage permission' : ''}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {t('common.export')}
            </Button>
          </div>
          <TopBottomCampaignsTable
            title={t('awareness.dashboard.needingAttention')}
            data={topBottomData?.bottom}
            isLoading={isLoadingTopBottom}
            filters={{
              dateFrom: actualFilters.dateFrom,
              dateTo: actualFilters.dateTo,
              status: actualFilters.status,
            }}
          />
        </div>
      </div>
    </div>
  );
}
