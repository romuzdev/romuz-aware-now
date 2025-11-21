/**
 * M18 Part 2: Playbook Execution Monitor Component
 * Real-time monitoring of playbook execution with step-by-step progress
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { useExecutionStepLogs } from '@/modules/playbooks/hooks';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PlaybookExecutionMonitorProps {
  executionId: string;
  playbookName?: string;
}

export function PlaybookExecutionMonitor({ 
  executionId, 
  playbookName 
}: PlaybookExecutionMonitorProps) {
  const { stepLogs, isLoading } = useExecutionStepLogs(executionId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'waiting_approval':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Play className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      completed: { label: 'مكتمل', variant: 'default' as any },
      failed: { label: 'فشل', variant: 'destructive' as any },
      running: { label: 'قيد التنفيذ', variant: 'secondary' as any },
      pending: { label: 'في الانتظار', variant: 'outline' as any },
      waiting_approval: { label: 'في انتظار الموافقة', variant: 'secondary' as any },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const completedSteps = stepLogs.filter(log => log.status === 'completed').length;
  const totalSteps = stepLogs.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Execution Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{playbookName || 'تنفيذ Playbook'}</CardTitle>
              <CardDescription>معرف التنفيذ: {executionId}</CardDescription>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">التقدم</p>
              <p className="text-2xl font-bold">
                {completedSteps} / {totalSteps}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>نسبة الإنجاز</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Logs */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الخطوات</CardTitle>
          <CardDescription>تفاصيل تنفيذ كل خطوة</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pl-4">
            <div className="space-y-4">
              {stepLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  {/* Timeline Connector */}
                  <div className="flex flex-col items-center">
                    <div className="rounded-full p-1 bg-background border-2">
                      {getStatusIcon(log.status)}
                    </div>
                    {index < stepLogs.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Step Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{log.step?.step_name || 'خطوة'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {log.step?.step_description_ar}
                        </p>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">بدأت: </span>
                        {formatDistanceToNow(new Date(log.started_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </div>
                      {log.completed_at && (
                        <div>
                          <span className="text-muted-foreground">انتهت: </span>
                          {formatDistanceToNow(new Date(log.completed_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </div>
                      )}
                      {log.duration_seconds && (
                        <div>
                          <span className="text-muted-foreground">المدة: </span>
                          {log.duration_seconds} ثانية
                        </div>
                      )}
                      {log.retry_count > 0 && (
                        <div>
                          <span className="text-muted-foreground">المحاولات: </span>
                          {log.retry_count}
                        </div>
                      )}
                    </div>

                    {log.error_message && (
                      <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                        <p className="text-sm text-destructive">
                          <strong>خطأ: </strong>
                          {log.error_message}
                        </p>
                      </div>
                    )}

                    {log.output_data && Object.keys(log.output_data).length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          عرض النتائج
                        </summary>
                        <pre className="mt-2 p-3 bg-muted rounded-md overflow-x-auto text-xs">
                          {JSON.stringify(log.output_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}

              {stepLogs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>لا توجد سجلات بعد</p>
                  <p className="text-sm mt-2">سيتم عرض السجلات عند بدء التنفيذ</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
