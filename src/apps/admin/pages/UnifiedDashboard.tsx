/**
 * M14 - Unified Executive Dashboard
 * Central KPI dashboard integrating all modules
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Download, Settings, Plus, RefreshCw } from 'lucide-react';
import { ExecutiveSummary } from '@/modules/dashboards/components/ExecutiveSummary';
import { CrossModuleKPIs } from '@/modules/dashboards/components/CrossModuleKPIs';
import { RealTimeMetricsGrid } from '@/modules/dashboards/components/RealTimeMetricsGrid';
import { TrendAnalysisCharts } from '@/modules/dashboards/components/TrendAnalysisCharts';
import { DashboardCustomizer } from '@/modules/dashboards/components/DashboardCustomizer';
import { useCustomDashboards } from '@/modules/dashboards/hooks';

export default function UnifiedDashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'ytd' | '1y'>('30d');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: dashboards } = useCustomDashboards();

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting dashboard...');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.unified.title', 'لوحة المؤشرات الموحدة')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('dashboard.unified.description', 'عرض شامل لمؤشرات الأداء الرئيسية عبر جميع الوحدات')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('period.7d', 'آخر 7 أيام')}</SelectItem>
              <SelectItem value="30d">{t('period.30d', 'آخر 30 يوم')}</SelectItem>
              <SelectItem value="90d">{t('period.90d', 'آخر 90 يوم')}</SelectItem>
              <SelectItem value="ytd">{t('period.ytd', 'منذ بداية العام')}</SelectItem>
              <SelectItem value="1y">{t('period.1y', 'آخر سنة')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Actions */}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 me-2" />
            {t('common.export', 'تصدير')}
          </Button>
          <Button variant="default" size="sm" onClick={() => setIsCustomizing(true)}>
            <Settings className="h-4 w-4 me-2" />
            {t('dashboard.customize', 'تخصيص')}
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary period={period} refreshKey={refreshKey} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            {t('dashboard.tabs.overview', 'نظرة عامة')}
          </TabsTrigger>
          <TabsTrigger value="modules">
            {t('dashboard.tabs.modules', 'الوحدات')}
          </TabsTrigger>
          <TabsTrigger value="trends">
            {t('dashboard.tabs.trends', 'الاتجاهات')}
          </TabsTrigger>
          <TabsTrigger value="realtime">
            {t('dashboard.tabs.realtime', 'مباشر')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RealTimeMetricsGrid period={period} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <CrossModuleKPIs period={period} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysisCharts period={period} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealTimeMetricsGrid period={period} refreshKey={refreshKey} realtime />
        </TabsContent>
      </Tabs>

      {/* Dashboard Customizer Dialog */}
      {isCustomizing && (
        <DashboardCustomizer
          open={isCustomizing}
          onClose={() => setIsCustomizing(false)}
        />
      )}
    </div>
  );
}
