/**
 * Automation Stats Card Component
 * Week 4 - Phase 4
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAutomationStats } from '../hooks/useAutomation';

export function AutomationStatsCard() {
  const { data: stats, isLoading } = useAutomationStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const successRate = stats
    ? stats.total_executions > 0
      ? ((stats.successful_executions / stats.total_executions) * 100).toFixed(1)
      : '0'
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي القواعد</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total_rules || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.active_rules || 0} مفعّلة
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">التنفيذات الناجحة</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.successful_executions || 0}</div>
          <p className="text-xs text-muted-foreground">
            نسبة النجاح: {successRate}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">التنفيذات الفاشلة</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {stats?.failed_executions || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            من أصل {stats?.total_executions || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">متوسط وقت التنفيذ</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats ? (stats.avg_execution_time_ms / 1000).toFixed(2) : '0'}s
          </div>
          <p className="text-xs text-muted-foreground">
            آخر 30 يوم
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
