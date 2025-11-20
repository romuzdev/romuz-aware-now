/**
 * Audit Dashboard Page
 * M12: Main dashboard for audit management with advanced analytics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useAuditStatistics } from '@/modules/grc';
import { FileCheck, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { AuditAnalyticsDashboard } from '@/modules/grc/components/audit';

export default function AuditDashboard() {
  const { data: stats, isLoading } = useAuditStatistics();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'إجمالي عمليات التدقيق',
      value: stats?.total_audits || 0,
      icon: FileCheck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'قيد التنفيذ',
      value: stats?.in_progress_audits || 0,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'مكتملة',
      value: stats?.completed_audits || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'الملاحظات المفتوحة',
      value: stats?.open_findings || 0,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">لوحة التدقيق</h1>
        <p className="text-muted-foreground">
          نظرة عامة على عمليات التدقيق الداخلية والخارجية
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={`${metric.bgColor} p-2 rounded-lg`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الملاحظات</CardTitle>
            <CardDescription>
              ملخص حالة الملاحظات المكتشفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">إجمالي الملاحظات</span>
                <Badge variant="outline">{stats?.total_findings || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">حرجة</span>
                <Badge variant="destructive">{stats?.critical_findings || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">مغلقة</span>
                <Badge variant="secondary">{stats?.closed_findings || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">متوسط أيام الإغلاق</span>
                <Badge>{stats?.avg_closure_days || 0} يوم</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأداء</CardTitle>
            <CardDescription>
              مؤشرات أداء عمليات التدقيق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">معدل الإنجاز</p>
                  <p className="text-2xl font-bold">
                    {stats ? Math.round((stats.completed_audits / stats.total_audits) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">معدل حل الملاحظات</p>
                  <p className="text-2xl font-bold">
                    {stats ? Math.round((stats.closed_findings / stats.total_findings) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Dashboard */}
      <AuditAnalyticsDashboard />
    </div>
  );
}
