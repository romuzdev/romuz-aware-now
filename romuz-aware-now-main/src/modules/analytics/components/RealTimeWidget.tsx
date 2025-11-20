/**
 * M14 - Real-Time Widget Component
 * Reusable widget for displaying live KPI data
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeWidgetProps {
  title: string;
  value: number | string;
  target?: number;
  unit?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  description?: string;
  isLoading?: boolean;
  className?: string;
}

export function RealTimeWidget({
  title,
  value,
  target,
  unit = '',
  icon: Icon = Activity,
  trend,
  status = 'neutral',
  description,
  isLoading = false,
  className
}: RealTimeWidgetProps) {
  const statusColors = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  const statusBadgeVariants = {
    success: 'default' as const,
    warning: 'secondary' as const,
    danger: 'destructive' as const,
    neutral: 'outline' as const
  };

  const achievementRate = target ? (Number(value) / target) * 100 : null;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-24"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-3xl font-bold', statusColors[status])}>
                {value}
              </span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>

            {/* Target and Achievement */}
            {target && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  الهدف: {target}
                </span>
                {achievementRate !== null && (
                  <Badge variant={statusBadgeVariants[status]}>
                    {achievementRate.toFixed(0)}%
                  </Badge>
                )}
              </div>
            )}

            {/* Trend Indicator */}
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : null}
                <span className={cn(
                  'text-sm font-medium',
                  trend.direction === 'up' ? 'text-success' : 
                  trend.direction === 'down' ? 'text-destructive' : 
                  'text-muted-foreground'
                )}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}

            {/* Live Indicator */}
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-xs text-muted-foreground">مباشر</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
