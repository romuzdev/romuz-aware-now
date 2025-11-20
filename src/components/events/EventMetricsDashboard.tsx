/**
 * Event Metrics Dashboard Component
 * 
 * Real-time monitoring dashboard for event system performance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Separator } from '@/core/components/ui/separator';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import type { EventMetrics, PerformanceMetrics, HealthMetrics } from '@/lib/events/monitoring/eventMetrics';

interface EventMetricsDashboardProps {
  refreshInterval?: number;
}

export function EventMetricsDashboard({ refreshInterval = 5000 }: EventMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [health, setHealth] = useState<HealthMetrics | null>(null);

  useEffect(() => {
    // Simulate metrics fetching
    const fetchMetrics = () => {
      // In real implementation, fetch from metricsCollector
      setMetrics({
        totalEvents: 1247,
        eventsByCategory: {
          policy: 234,
          action: 189,
          training: 156,
          awareness: 143,
          admin: 98,
        },
        eventsByPriority: {
          low: 432,
          medium: 567,
          high: 198,
          critical: 50,
        },
        eventsPerSecond: 12.5,
        eventsPerMinute: 748,
        averageProcessingTime: 45,
        failedEvents: 8,
        throttledEvents: 23,
        cachedHits: 892,
        cachedMisses: 234,
        batchesProcessed: 156,
        lastUpdated: new Date().toISOString(),
      });

      setPerformance({
        avgPublishTime: 45,
        avgProcessTime: 38,
        p50PublishTime: 32,
        p95PublishTime: 89,
        p99PublishTime: 156,
        slowestEvent: {
          event_type: 'policy_approved',
          duration: 234,
        },
        fastestEvent: {
          event_type: 'user_login',
          duration: 12,
        },
      });

      setHealth({
        status: 'healthy',
        uptime: 3600000,
        eventProcessingRate: 12.5,
        errorRate: 0.64,
        throttleRate: 1.84,
        cacheHitRate: 79.2,
        lastHealthCheck: new Date().toISOString(),
        issues: [],
      });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!metrics || !performance || !health) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">جاري تحميل المقاييس...</div>
      </div>
    );
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالة النظام</CardTitle>
            {getHealthStatusIcon(health.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health.status === 'healthy' ? 'سليم' : health.status === 'degraded' ? 'متدهور' : 'غير سليم'}
            </div>
            <p className="text-xs text-muted-foreground">
              معدل المعالجة: {health.eventProcessingRate.toFixed(1)} حدث/ثانية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأحداث</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.eventsPerMinute} حدث/دقيقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت المعالجة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProcessingTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              P95: {performance.p95PublishTime.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل إصابة الذاكرة المؤقتة</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.cachedHits} إصابة / {metrics.cachedMisses} إخفاق
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع الأحداث حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.eventsByCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([category, count]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">{count} حدث</span>
                  </div>
                  <Progress value={(count / metrics.totalEvents) * 100} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الأولويات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.eventsByPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    priority === 'critical' ? 'destructive' :
                    priority === 'high' ? 'default' :
                    priority === 'medium' ? 'secondary' :
                    'outline'
                  }>
                    {priority === 'critical' ? 'حرجة' :
                     priority === 'high' ? 'عالية' :
                     priority === 'medium' ? 'متوسطة' :
                     'منخفضة'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {((count / metrics.totalEvents) * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Error and Throttle Stats */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">معدل الأخطاء</span>
                <Badge variant={health.errorRate > 5 ? 'destructive' : 'outline'}>
                  {health.errorRate.toFixed(2)}%
                </Badge>
              </div>
              <Progress value={health.errorRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.failedEvents} أحداث فاشلة
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">معدل الاختناق</span>
                <Badge variant={health.throttleRate > 10 ? 'destructive' : 'outline'}>
                  {health.throttleRate.toFixed(2)}%
                </Badge>
              </div>
              <Progress value={health.throttleRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.throttledEvents} حدث مختنق
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">دفعات معالجة</span>
                <Badge variant="outline">{metrics.batchesProcessed}</Badge>
              </div>
              <Progress value={50} className="h-2" />
              <p className="text-xs text-muted-foreground">
                متوسط حجم الدفعة: {(metrics.totalEvents / Math.max(metrics.batchesProcessed, 1)).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Issues */}
      {health.issues.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              تنبيهات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {health.issues.map((issue, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
