/**
 * Workflow Executions List Component
 * Week 4 - Phase 4
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Activity, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useWorkflowExecutions } from '../hooks/useAutomation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WorkflowExecutionsListProps {
  ruleId?: string;
}

export function WorkflowExecutionsList({ ruleId }: WorkflowExecutionsListProps) {
  const { data: executions, isLoading } = useWorkflowExecutions(ruleId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'failed':
        return 'destructive' as const;
      case 'running':
        return 'secondary' as const;
      case 'pending':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'failed':
        return 'فشل';
      case 'running':
        return 'قيد التنفيذ';
      case 'pending':
        return 'معلق';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل التنفيذات</CardTitle>
        <CardDescription>
          عرض جميع عمليات تنفيذ سير العمل
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!executions || executions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد سجل تنفيذات حالياً</p>
            </div>
          ) : (
            executions.map((execution) => (
              <div
                key={execution.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(execution.status)}
                    <Badge variant={getStatusVariant(execution.status)}>
                      {getStatusLabel(execution.status)}
                    </Badge>
                    <span className="text-sm font-medium">{execution.trigger_event}</span>
                  </div>
                  
                  {execution.error_message && (
                    <p className="text-sm text-destructive">{execution.error_message}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      الإجراءات: {execution.actions_executed}/{execution.actions_total}
                    </span>
                    {execution.started_at && (
                      <span>
                        بدأ: {format(new Date(execution.started_at), 'PPp', { locale: ar })}
                      </span>
                    )}
                    {execution.completed_at && (
                      <span>
                        انتهى: {format(new Date(execution.completed_at), 'PPp', { locale: ar })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
