/**
 * Metric Comparison Card Component
 * Week 4 - Phase 3
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useMetricComparison } from '../hooks/useAnalytics';
import type { DateRange } from '../types/analytics.types';

interface MetricComparisonCardProps {
  metric: string;
  title: string;
  currentPeriod: DateRange;
  previousPeriod: DateRange;
}

export function MetricComparisonCard({
  metric,
  title,
  currentPeriod,
  previousPeriod,
}: MetricComparisonCardProps) {
  const { data: comparison, isLoading } = useMetricComparison(
    metric,
    currentPeriod,
    previousPeriod
  );

  const getStatusIcon = () => {
    if (!comparison) return <Minus className="h-4 w-4" />;
    
    switch (comparison.status) {
      case 'improved':
        return <ArrowUp className="h-4 w-4 text-success" />;
      case 'declined':
        return <ArrowDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = () => {
    if (!comparison) return 'outline' as const;
    
    switch (comparison.status) {
      case 'improved':
        return 'default' as const;
      case 'declined':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">جاري التحميل...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>مقارنة مع الفترة السابقة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{comparison?.current || 0}</div>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {comparison && (
              <span>
                {comparison.percentChange > 0 ? '+' : ''}
                {comparison.percentChange.toFixed(1)}%
              </span>
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">الفترة الحالية</p>
            <p className="font-semibold">{comparison?.current || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">الفترة السابقة</p>
            <p className="font-semibold">{comparison?.previous || 0}</p>
          </div>
        </div>

        {comparison && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {comparison.status === 'improved' && 'تحسن ملحوظ في الأداء'}
              {comparison.status === 'declined' && 'انخفاض يحتاج انتباه'}
              {comparison.status === 'stable' && 'أداء مستقر'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
