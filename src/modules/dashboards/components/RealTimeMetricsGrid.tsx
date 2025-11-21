/**
 * M14 - Real-Time Metrics Grid Component
 * Display live metrics with auto-refresh
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeMetricsGridProps {
  period: '7d' | '30d' | '90d' | 'ytd' | '1y';
  refreshKey?: number;
  realtime?: boolean;
}

export function RealTimeMetricsGrid({ period, refreshKey, realtime = false }: RealTimeMetricsGridProps) {
  const { t } = useTranslation();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (realtime) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realtime]);

  // TODO: Replace with real data from API
  const metrics = [
    {
      title: t('metrics.active_users', 'المستخدمون النشطون'),
      value: '234',
      change: '+12',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      live: true,
    },
    {
      title: t('metrics.active_sessions', 'الجلسات النشطة'),
      value: '42',
      change: '+5',
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      live: true,
    },
    {
      title: t('metrics.engagement_rate', 'معدل التفاعل'),
      value: '68%',
      change: '+3%',
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      live: false,
    },
    {
      title: t('metrics.avg_session_time', 'متوسط وقت الجلسة'),
      value: '12m',
      change: '+2m',
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      live: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Last Update Indicator */}
      {realtime && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse text-green-500" />
          <span>
            {t('metrics.last_update', 'آخر تحديث')}: {lastUpdate.toLocaleTimeString('ar-SA')}
          </span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <Card key={index} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {metric.live && realtime && (
                    <Badge variant="outline" className="text-xs">
                      <Activity className="h-2 w-2 me-1 animate-pulse text-green-500" />
                      {t('common.live', 'مباشر')}
                    </Badge>
                  )}
                  <div className={cn('p-2 rounded-lg', metric.bgColor)}>
                    <Icon className={cn('h-4 w-4', metric.color)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-foreground">
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {metric.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Real-Time Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('metrics.recent_activities', 'الأنشطة الأخيرة')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="flex-1 text-muted-foreground">
                    {t('metrics.activity_placeholder', 'نشاط جديد')} {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {i + 1}m
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('metrics.system_status', 'حالة النظام')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('metrics.database', 'قاعدة البيانات')}
                </span>
                <Badge variant="default" className="bg-green-500">
                  {t('common.operational', 'تعمل')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('metrics.api', 'واجهة برمجة التطبيقات')}
                </span>
                <Badge variant="default" className="bg-green-500">
                  {t('common.operational', 'تعمل')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('metrics.integrations', 'التكاملات')}
                </span>
                <Badge variant="default" className="bg-green-500">
                  {t('common.operational', 'تعمل')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
