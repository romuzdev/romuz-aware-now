/**
 * Advanced Analytics Page
 * Week 4 - Phase 3
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Download, BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { RealtimeMetricsGrid } from '@/modules/analytics/components/RealtimeMetricsGrid';
import { TrendChart } from '@/modules/analytics/components/TrendChart';
import { PredictiveInsightsPanel } from '@/modules/analytics/components/PredictiveInsightsPanel';
import { MetricComparisonCard } from '@/modules/analytics/components/MetricComparisonCard';
import { subDays, subMonths } from 'date-fns';

export default function AdvancedAnalytics() {
  const today = new Date();
  const [dateRange] = useState({
    start: subDays(today, 30).toISOString(),
    end: today.toISOString(),
  });

  const filters = {
    dateRange,
  };

  const currentPeriod = {
    start: subDays(today, 30).toISOString(),
    end: today.toISOString(),
    preset: 'month' as const,
  };

  const previousPeriod = {
    start: subMonths(today, 2).toISOString(),
    end: subMonths(today, 1).toISOString(),
    preset: 'month' as const,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التحليلات المتقدمة</h1>
          <p className="text-muted-foreground mt-2">
            تحليلات تفصيلية ورؤى تنبؤية في الوقت الفعلي
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Realtime Metrics */}
      <RealtimeMetricsGrid filters={filters} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">
            <TrendingUp className="ml-2 h-4 w-4" />
            التوجهات
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <BarChart3 className="ml-2 h-4 w-4" />
            المقارنات
          </TabsTrigger>
          <TabsTrigger value="predictive">
            <Sparkles className="ml-2 h-4 w-4" />
            التنبؤات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <TrendChart
              metric="campaigns"
              title="توجه الحملات"
              description="عدد الحملات عبر الزمن"
              filters={filters}
            />
            <TrendChart
              metric="completion_rate"
              title="معدل الإكمال"
              description="تطور معدل إكمال الحملات"
              filters={filters}
            />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricComparisonCard
              metric="total_campaigns"
              title="إجمالي الحملات"
              currentPeriod={currentPeriod}
              previousPeriod={previousPeriod}
            />
            <MetricComparisonCard
              metric="active_campaigns"
              title="الحملات النشطة"
              currentPeriod={currentPeriod}
              previousPeriod={previousPeriod}
            />
            <MetricComparisonCard
              metric="completed_campaigns"
              title="الحملات المكتملة"
              currentPeriod={currentPeriod}
              previousPeriod={previousPeriod}
            />
            <MetricComparisonCard
              metric="engagement_score"
              title="درجة التفاعل"
              currentPeriod={currentPeriod}
              previousPeriod={previousPeriod}
            />
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveInsightsPanel filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
