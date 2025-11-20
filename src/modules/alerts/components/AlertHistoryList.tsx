/**
 * Alert History List Component
 * Week 4 - Phase 2
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import { useAlertHistory } from '@/modules/alerts/hooks/useAlertHistory';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function AlertHistoryList() {
  const { data: events, isLoading } = useAlertHistory();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'destructive';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'secondary';
      case 'acknowledged': return 'secondary';
      case 'dispatched': return 'outline';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل التنبيهات</CardTitle>
        <CardDescription>
          عرض جميع التنبيهات والإشعارات السابقة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!events || events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد سجل تنبيهات حالياً</p>
            </div>
          ) : (
            events.map((event: any) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      القيمة: {event.metric_value}
                    </p>
                    {event.error_message && (
                      <p className="text-sm text-destructive mt-1">
                        {event.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-left text-sm text-muted-foreground">
                  {format(new Date(event.created_at), 'PPp', { locale: ar })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
