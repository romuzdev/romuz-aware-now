import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Users, Play, CheckCircle, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AwarenessKPICardsProps {
  data?: {
    totalParticipants: number;
    started: number;
    completed: number;
    avgScore: number | null;
    overdue: number;
    completionRate: number | null;
  };
  isLoading?: boolean;
}

export function AwarenessKPICards({ data, isLoading }: AwarenessKPICardsProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: t('awareness.analytics.kpis.totalParticipants'),
      value: data?.totalParticipants || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: t('awareness.analytics.kpis.started'),
      value: data?.started || 0,
      icon: Play,
      color: 'text-green-600',
    },
    {
      title: t('awareness.analytics.kpis.completed'),
      value: data?.completed || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
    },
    {
      title: t('awareness.analytics.kpis.completionRate'),
      value: data?.completionRate
        ? `${data.completionRate.toFixed(1)}%`
        : t('common.noData'),
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: t('awareness.analytics.kpis.avgScore'),
      value: data?.avgScore ? `${data.avgScore.toFixed(1)}%` : t('common.noData'),
      icon: Award,
      color: 'text-amber-600',
    },
    {
      title: t('awareness.analytics.kpis.overdue'),
      value: data?.overdue || 0,
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className={cn('h-4 w-4', kpi.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
