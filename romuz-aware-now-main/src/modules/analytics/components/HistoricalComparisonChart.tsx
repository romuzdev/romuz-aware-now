/**
 * Historical Comparison Chart Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useHistoricalComparison } from '../hooks/useUnifiedKPIs';
import { Skeleton } from '@/core/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';

interface HistoricalComparisonChartProps {
  periodDays?: number;
}

export function HistoricalComparisonChart({ periodDays = 30 }: HistoricalComparisonChartProps) {
  const { data: comparisons, isLoading } = useHistoricalComparison(periodDays);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!comparisons || comparisons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المقارنة التاريخية</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            لا توجد بيانات تاريخية للمقارنة
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>المقارنة مع آخر {periodDays} يوم</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {comparisons.slice(0, 10).map((comp, idx) => {
            const Icon = 
              comp.change_direction === 'up' ? TrendingUp :
              comp.change_direction === 'down' ? TrendingDown : Minus;
            
            const colorClass = 
              comp.change_direction === 'up' ? 'text-success' :
              comp.change_direction === 'down' ? 'text-destructive' : 'text-muted-foreground';

            return (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <span className="text-sm font-medium">{comp.kpi_key}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {comp.previous_value.toFixed(1)} → {comp.current_value.toFixed(1)}
                  </div>
                  <Badge variant={comp.change_direction === 'up' ? 'default' : 'destructive'}>
                    {comp.change_percentage > 0 ? '+' : ''}{comp.change_percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
