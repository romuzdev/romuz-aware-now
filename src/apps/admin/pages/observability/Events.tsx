// ============================================================================
// Gate-E: Alert Events History Page
// ============================================================================

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { fetchAlertEvents } from '@/modules/observability/integration';
import { runGateECloseoutTests } from '@/modules/observability/integration';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Skeleton } from '@/core/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AlertEventsPage() {
  const { tenantId } = useAppContext();
  const [limit] = useState(100);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['alert-events', tenantId, limit],
    queryFn: () => fetchAlertEvents(tenantId!, limit),
    enabled: !!tenantId,
  });

  const smokeTestMutation = useMutation({
    mutationFn: runGateECloseoutTests,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('اختبارات Gate-E نجحت! تم إنشاء بيانات تجريبية وتفعيل جميع المكونات.');
        queryClient.invalidateQueries({ queryKey: ['alert-events', tenantId] });
      } else {
        toast.error(`فشل اختبارات Gate-E: ${result.errors?.join(', ')}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`فشل تشغيل الاختبارات: ${error.message}`);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dispatched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warn':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">سجل التنبيهات</h1>
          <p className="text-muted-foreground mt-1">
            عرض تاريخ التنبيهات المرسلة والمعلقة
          </p>
        </div>
        <Button
          onClick={() => smokeTestMutation.mutate()}
          disabled={smokeTestMutation.isPending}
          variant="outline"
        >
          <Play className="h-4 w-4 mr-2" />
          {smokeTestMutation.isPending ? 'جاري التنفيذ...' : 'Run Smoke Tests'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التنبيهات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              آخر {limit} تنبيه
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم الإرسال</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === 'dispatched').length}
            </div>
            <p className="text-xs text-muted-foreground">
              تنبيهات ناجحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معلق / فشل</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status !== 'dispatched').length}
            </div>
            <p className="text-xs text-muted-foreground">
              يحتاج متابعة
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التنبيهات الأخيرة</CardTitle>
          <CardDescription>
            آخر {events.length} تنبيه في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تنبيهات حتى الآن.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوقت</TableHead>
                  <TableHead>الأهمية</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>رسالة الخطأ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm">
                      {format(new Date(event.created_at), 'PPp', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity === 'critical' ? 'حرج' : 
                         event.severity === 'warn' ? 'تحذير' : 'معلومات'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{event.metric_value.toFixed(2)}%</span>
                        {event.baseline_value && (
                          <span className="text-muted-foreground ml-2">
                            (مقارنة: {event.baseline_value.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(event.status)}
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status === 'dispatched' ? 'تم الإرسال' :
                           event.status === 'failed' ? 'فشل' : 'معلق'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {event.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
