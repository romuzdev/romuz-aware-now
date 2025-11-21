/**
 * M18: Incident SLA Monitor Component
 * Real-time SLA tracking and breach alerts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useCheckSLABreach } from '@/modules/incident-response/hooks';

interface IncidentSLAMonitorProps {
  incidentId: string;
  severity: string;
  createdAt: string;
  responseDeadline?: string;
  resolutionDeadline?: string;
}

export function IncidentSLAMonitor({
  incidentId,
  severity,
  createdAt,
  responseDeadline,
  resolutionDeadline,
}: IncidentSLAMonitorProps) {
  const { data: slaStatus } = useCheckSLABreach(incidentId);

  const calculateProgress = (deadline?: string) => {
    if (!deadline) return 0;
    
    const now = new Date().getTime();
    const start = new Date(createdAt).getTime();
    const end = new Date(deadline).getTime();
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.min((elapsed / total) * 100, 100);
  };

  const responseProgress = calculateProgress(responseDeadline);
  const resolutionProgress = calculateProgress(resolutionDeadline);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>حالة SLA</span>
          <Badge variant={getSeverityColor(severity)}>
            {severity === 'critical' && 'حرجة'}
            {severity === 'high' && 'عالية'}
            {severity === 'medium' && 'متوسطة'}
            {severity === 'low' && 'منخفضة'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Response SLA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">وقت الاستجابة</span>
            {slaStatus?.responseBreached ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                تجاوز SLA بـ {slaStatus.responseMinutesOverdue} دقيقة
              </Badge>
            ) : responseProgress >= 80 ? (
              <Badge variant="default" className="gap-1">
                <Clock className="h-3 w-3" />
                قرب الانتهاء
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                ضمن الوقت
              </Badge>
            )}
          </div>
          <Progress 
            value={responseProgress} 
            className={`h-2 ${slaStatus?.responseBreached ? 'bg-destructive/20' : ''}`}
          />
          {responseDeadline && (
            <p className="text-xs text-muted-foreground">
              الموعد النهائي: {new Date(responseDeadline).toLocaleString('ar-SA')}
            </p>
          )}
        </div>

        {/* Resolution SLA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">وقت الحل</span>
            {slaStatus?.resolutionBreached ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                تجاوز SLA بـ {slaStatus.resolutionHoursOverdue} ساعة
              </Badge>
            ) : resolutionProgress >= 80 ? (
              <Badge variant="default" className="gap-1">
                <Clock className="h-3 w-3" />
                قرب الانتهاء
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                ضمن الوقت
              </Badge>
            )}
          </div>
          <Progress 
            value={resolutionProgress}
            className={`h-2 ${slaStatus?.resolutionBreached ? 'bg-destructive/20' : ''}`}
          />
          {resolutionDeadline && (
            <p className="text-xs text-muted-foreground">
              الموعد النهائي: {new Date(resolutionDeadline).toLocaleString('ar-SA')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
