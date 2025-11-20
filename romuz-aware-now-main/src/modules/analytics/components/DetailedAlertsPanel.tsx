/**
 * Detailed Alerts Panel Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { useKPIAlerts, useAcknowledgeAlert } from '../hooks/useUnifiedKPIs';
import { Skeleton } from '@/core/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function DetailedAlertsPanel() {
  const { data: alerts, isLoading } = useKPIAlerts({ acknowledged: false });
  const acknowledgeMutation = useAcknowledgeAlert();

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const criticalAlerts = alerts?.filter(a => a.severity === 'critical') || [];
  const highAlerts = alerts?.filter(a => a.severity === 'high') || [];
  const otherAlerts = alerts?.filter(a => !['critical', 'high'].includes(a.severity)) || [];

  const severityConfig = {
    critical: { label: 'حرج', icon: AlertTriangle, color: 'destructive' as const },
    high: { label: 'عالي', icon: AlertTriangle, color: 'destructive' as const },
    medium: { label: 'متوسط', icon: Clock, color: 'default' as const },
    low: { label: 'منخفض', icon: CheckCircle, color: 'secondary' as const }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>التنبيهات النشطة</span>
          <Badge variant="outline">{alerts?.length || 0} تنبيه</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              تنبيهات حرجة ({criticalAlerts.length})
            </h3>
            {criticalAlerts.map(alert => {
              const config = severityConfig[alert.severity];
              return (
                <div key={alert.id} className="border border-destructive/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={config.color}>{config.label}</Badge>
                        <Badge variant="outline">{alert.module}</Badge>
                      </div>
                      <h4 className="font-semibold">{alert.kpi_name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      إقرار
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* High Alerts */}
        {highAlerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              تنبيهات عالية الأولوية ({highAlerts.length})
            </h3>
            {highAlerts.map(alert => {
              const config = severityConfig[alert.severity];
              return (
                <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={config.color}>{config.label}</Badge>
                        <Badge variant="outline">{alert.module}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{alert.kpi_name}</h4>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                    >
                      إقرار
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Other Alerts */}
        {otherAlerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              تنبيهات أخرى ({otherAlerts.length})
            </h3>
            {otherAlerts.map(alert => {
              const config = severityConfig[alert.severity];
              return (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={config.color} className="text-xs">{config.label}</Badge>
                    <span className="text-sm">{alert.kpi_name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => acknowledgeMutation.mutate(alert.id)}
                  >
                    إقرار
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {alerts?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
            <p>لا توجد تنبيهات نشطة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
