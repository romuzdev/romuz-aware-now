/**
 * M14 - Executive Summary Component
 * High-level summary cards with key metrics
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/core/components/ui/skeleton';

interface ExecutiveSummaryProps {
  period: '7d' | '30d' | '90d' | 'ytd' | '1y';
  refreshKey?: number;
}

export function ExecutiveSummary({ period, refreshKey }: ExecutiveSummaryProps) {
  const { t } = useTranslation();

  // TODO: Replace with real data from API
  const summaryData = [
    {
      title: t('summary.overall_health', 'الصحة العامة'),
      value: '87%',
      change: '+5%',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('summary.critical_risks', 'المخاطر الحرجة'),
      value: '3',
      change: '-2',
      trend: 'down' as const,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: t('summary.compliance_rate', 'معدل الامتثال'),
      value: '94%',
      change: '+3%',
      trend: 'up' as const,
      icon: CheckCircle2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('summary.campaign_completion', 'إنجاز الحملات'),
      value: '76%',
      change: '+12%',
      trend: 'up' as const,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryData.map((item, index) => {
        const Icon = item.icon;
        const isPositive = item.trend === 'up';
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={index} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', item.bgColor)}>
                <Icon className={cn('h-4 w-4', item.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-foreground">
                  {item.value}
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  isPositive ? 'text-green-600' : 'text-destructive'
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {item.change}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('summary.compared_to', 'مقارنة بالفترة السابقة')}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function ExecutiveSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
