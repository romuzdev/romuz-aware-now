/**
 * Realtime Metrics Grid Component
 * Week 4 - Phase 3
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { useRealtimeMetrics } from '../hooks/useAnalytics';
import type { AnalyticsFilters } from '../types/analytics.types';

interface RealtimeMetricsGridProps {
  filters: AnalyticsFilters;
}

export function RealtimeMetricsGrid({ filters }: RealtimeMetricsGridProps) {
  const { data: metrics, isLoading } = useRealtimeMetrics(filters);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics?.map((metric) => (
        <Card key={metric.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{metric.value}</div>
              <Badge variant="outline" className="flex items-center gap-1">
                {getTrendIcon(metric.trend)}
                {metric.changePercent && (
                  <span className="text-xs">
                    {metric.changePercent > 0 ? '+' : ''}
                    {metric.changePercent.toFixed(1)}%
                  </span>
                )}
              </Badge>
            </div>
            {metric.previousValue && (
              <p className="text-xs text-muted-foreground mt-1">
                مقارنة بـ {metric.previousValue} في الفترة السابقة
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
