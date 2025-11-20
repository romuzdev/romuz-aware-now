// Gate-I • Part 3B — KPI Cards Component Implementation
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: number | string;
  change: number;
  suffix?: string;
  loading?: boolean;
}

export default function KpiCard({
  title,
  value,
  change,
  suffix = '%',
  loading = false,
}: KpiCardProps) {
  // Format value if it's a number
  const formattedValue = typeof value === 'number' 
    ? `${value.toFixed(1)}${suffix}` 
    : value;

  // Determine trend direction and color
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColorClass = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <Card className="relative rounded-2xl shadow-sm bg-card dark:bg-card transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold tracking-tight">
                {formattedValue}
              </div>
              
              {/* Trend icon in right corner */}
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-full', 
                isPositive ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
              )}>
                <TrendIcon className={cn('h-4 w-4', trendColorClass)} />
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-2">
              <span className={cn('text-xs font-medium', trendColorClass)}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs previous period
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
