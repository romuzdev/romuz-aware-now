/**
 * M21 - System Command Dashboard
 * Real-time platform monitoring and control center
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Separator } from '@/core/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Server, 
  Users, 
  TrendingUp,
  RefreshCw,
  Bell,
  XCircle
} from 'lucide-react';
import {
  useSystemHealth,
  useTenantOverviews,
  useSystemMetrics,
  usePlatformAlerts,
  useAcknowledgePlatformAlert,
  useResolvePlatformAlert,
  useDismissPlatformAlert,
} from '@/modules/platform/hooks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SystemCommand() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: tenants, isLoading: tenantsLoading } = useTenantOverviews();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: alerts, isLoading: alertsLoading } = usePlatformAlerts({ status: 'active' });
  
  const acknowledgeAlert = useAcknowledgePlatformAlert();
  const resolveAlert = useResolvePlatformAlert();
  const dismissAlert = useDismissPlatformAlert();

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'unhealthy': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'error': return 'text-orange-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة القيادة المركزية</h1>
          <p className="text-muted-foreground">مراقبة وإدارة النظام في الوقت الفعلي</p>
        </div>
        <Button onClick={() => refetchHealth()} variant="outline" size="sm">
          <RefreshCw className="ml-2 h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالة النظام</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className={cn("h-5 w-5", getHealthStatusColor(health?.overall_status))} />
              <div className="text-2xl font-bold">
                {health?.overall_status === 'healthy' ? 'سليم' : 
                 health?.overall_status === 'degraded' ? 'متدهور' : 
                 health?.overall_status === 'critical' ? 'حرج' : 'جاري التحميل...'}
              </div>
            </div>
            <Badge variant={getHealthStatusBadge(health?.overall_status)} className="mt-2">
              {health?.error_rate ? `${(100 - health.error_rate).toFixed(2)}%` : '100%'} وقت التشغيل
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء النشطون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {tenants?.filter(t => t.status === 'active').length || 0} عميل نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التنبيهات النشطة</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {alerts?.filter(a => a.severity === 'critical').length || 0} حرجة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أداء النظام</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.api_response_time ? `${health.api_response_time}ms` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">متوسط وقت الاستجابة</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="tenants">العملاء</TabsTrigger>
          <TabsTrigger value="metrics">المقاييس</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Database Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  حالة قاعدة البيانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>الحالة</span>
                      <Badge variant={getHealthStatusBadge(health.overall_status)}>
                        {health.overall_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الاتصالات النشطة</span>
                      <span className="font-medium">{health.database_connections || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>استخدام القرص</span>
                      <span className="font-medium">{health.disk_usage?.toFixed(2) || 0}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات متاحة</p>
                )}
              </CardContent>
            </Card>

            {/* API Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  حالة الـ API
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>الحالة</span>
                      <Badge variant={getHealthStatusBadge(health.overall_status)}>
                        {health.overall_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>وقت الاستجابة</span>
                      <span className="font-medium">{health.api_response_time || 0}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل الأخطاء</span>
                      <span className="font-medium">{health.error_rate?.toFixed(2) || 0}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات متاحة</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نظرة عامة على العملاء</CardTitle>
              <CardDescription>قائمة بجميع العملاء وحالتهم</CardDescription>
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <p>جاري التحميل...</p>
              ) : tenants && tenants.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {tenants.map((tenant) => (
                      <div key={tenant.tenant_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{tenant.tenant_name}</p>
                          <p className="text-sm text-muted-foreground">ID: {tenant.tenant_id}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status === 'active' ? 'نشط' : tenant.status}
                          </Badge>
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">آخر نشاط</p>
                            <p>{format(new Date(tenant.last_activity), 'yyyy-MM-dd')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مقاييس النظام</CardTitle>
              <CardDescription>المقاييس الحديثة للنظام</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <p>جاري التحميل...</p>
              ) : metrics && metrics.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {metrics.map((metric) => (
                      <div key={metric.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="space-y-1">
                          <p className="font-medium">{metric.metric_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {metric.source_component || 'النظام'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {metric.metric_value} {metric.metric_unit}
                          </p>
                          <Badge variant={metric.severity === 'critical' ? 'destructive' : 'outline'}>
                            {metric.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد مقاييس</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات النشطة</CardTitle>
              <CardDescription>تنبيهات تتطلب انتباهك</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <p>جاري التحميل...</p>
              ) : alerts && alerts.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={cn(
                          "p-4 border rounded-lg space-y-2",
                          alert.severity === 'critical' && "border-red-500 bg-red-50/50",
                          alert.severity === 'error' && "border-orange-500 bg-orange-50/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={cn("h-4 w-4", getSeverityColor(alert.severity))} />
                              <p className="font-medium">{alert.title}</p>
                              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(alert.created_at), 'yyyy-MM-dd HH:mm')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {alert.status === 'active' && !alert.acknowledged_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlert.mutate(alert.id)}
                                disabled={acknowledgeAlert.isPending}
                              >
                                إقرار
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => resolveAlert.mutate(alert.id)}
                              disabled={resolveAlert.isPending}
                            >
                              حل
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissAlert.mutate(alert.id)}
                              disabled={dismissAlert.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">لا توجد تنبيهات نشطة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
