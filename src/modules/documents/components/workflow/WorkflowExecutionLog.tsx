/**
 * Workflow Execution Log Component
 * 
 * Displays execution history for workflow rules
 */

import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CheckCircle2, XCircle, MinusCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { useWorkflowExecutions } from '../../hooks/useDocumentWorkflows';

interface WorkflowExecutionLogProps {
  documentId?: string;
  ruleId?: string;
}

export function WorkflowExecutionLog({ documentId, ruleId }: WorkflowExecutionLogProps) {
  const { data: executions = [], isLoading } = useWorkflowExecutions(documentId, ruleId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped':
        return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      success: { label: 'نجح', variant: 'default' },
      failed: { label: 'فشل', variant: 'destructive' },
      skipped: { label: 'متجاوز', variant: 'secondary' },
      pending: { label: 'قيد التنفيذ', variant: 'outline' },
    };
    const config = variants[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل التنفيذ</CardTitle>
        <CardDescription>
          سجل تنفيذ قواعد التشغيل الآلي
          {documentId && ' لهذه الوثيقة'}
          {ruleId && ' لهذه القاعدة'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            لا يوجد سجل تنفيذ بعد
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الحالة</TableHead>
                <TableHead>الوقت</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>الإجراءات</TableHead>
                <TableHead>الملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.execution_status)}
                      {getStatusBadge(execution.execution_status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(execution.created_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell>
                    {execution.execution_duration_ms
                      ? `${execution.execution_duration_ms}ms`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.actions_performed
                      ? JSON.stringify(execution.actions_performed).substring(0, 50) + '...'
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.error_message && (
                      <span className="text-destructive text-sm">
                        {execution.error_message}
                      </span>
                    )}
                    {execution.trigger_event && (
                      <span className="text-muted-foreground text-sm">
                        {execution.trigger_event}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
