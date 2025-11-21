/**
 * SecOps Dashboard Page
 * M18.5 - Security Operations Center
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { Shield } from 'lucide-react';
import { useSecOpsStatistics } from '@/modules/secops/hooks';
import { SecOpsStatisticsCards } from '@/modules/secops/components';
import { useRecentCriticalEvents } from '@/modules/secops/hooks/useSecurityEvents';
import { useRecentExecutions } from '@/modules/secops/hooks/useSOARExecutions';
import { SecurityEventCard } from '@/modules/secops/components';
import { Card } from '@/core/components/ui/card';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Dashboard() {
  const { data: statistics, isLoading: statsLoading } = useSecOpsStatistics();
  const { data: criticalEvents, isLoading: eventsLoading } = useRecentCriticalEvents(5);
  const { data: recentExecutions, isLoading: executionsLoading } = useRecentExecutions(5);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="مركز العمليات الأمنية (SOC)"
        description="مراقبة وإدارة الأحداث الأمنية والاستجابة الآلية"
      />

      <SecOpsStatisticsCards statistics={statistics || null} loading={statsLoading} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Critical Events */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">الأحداث الحرجة الأخيرة</h2>
          {eventsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </Card>
              ))}
            </div>
          ) : criticalEvents && criticalEvents.length > 0 ? (
            <div className="space-y-3">
              {criticalEvents.map((event) => (
                <SecurityEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              لا توجد أحداث حرجة حالياً
            </Card>
          )}
        </div>

        {/* Recent Executions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">تنفيذات SOAR الأخيرة</h2>
          {executionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </Card>
              ))}
            </div>
          ) : recentExecutions && recentExecutions.length > 0 ? (
            <div className="space-y-3">
              {recentExecutions.map((execution) => (
                <Card key={execution.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">تنفيذ #{execution.id.slice(0, 8)}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                      execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                      execution.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {execution.status === 'completed' ? 'مكتمل' :
                       execution.status === 'failed' ? 'فشل' :
                       execution.status === 'cancelled' ? 'ملغي' : 'قيد التشغيل'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(execution.started_at), 'PPp', { locale: ar })}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              لا توجد تنفيذات حديثة
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
