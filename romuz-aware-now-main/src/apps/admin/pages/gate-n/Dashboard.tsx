/**
 * Gate-N System Dashboard (N1)
 * Admin Console & Control Center - Main Dashboard
 * 
 * Features:
 * - System status snapshot with KPI cards
 * - Jobs statistics and recent runs
 * - Real-time updates every 30 seconds
 * - Status indicators with color coding
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Badge } from '@/core/components/ui/badge';
import { useGateNStatus } from '@/lib/api/gateN';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GateNDashboard() {
  const { data: response, isLoading, error, isRefetching } = useGateNStatus();

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !response?.success) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {response?.message || 'فشل تحميل بيانات النظام. يرجى المحاولة مرة أخرى.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusData = response.data;
  const jobs = statusData?.jobs || { total: 0, enabled: 0, runs_last_24h: { succeeded: 0, failed: 0, running: 0 } };
  const adminSettings = statusData?.admin_settings || { updated_at: null };

  // Calculate statistics
  const totalRuns = jobs.runs_last_24h.succeeded + jobs.runs_last_24h.failed + jobs.runs_last_24h.running;
  const successRate = totalRuns > 0 
    ? Math.round((jobs.runs_last_24h.succeeded / totalRuns) * 100) 
    : 0;

  // Status indicators
  const systemHealthy = jobs.runs_last_24h.failed === 0 && jobs.enabled > 0;
  const hasRunningJobs = jobs.runs_last_24h.running > 0;
  const hasFailedJobs = jobs.runs_last_24h.failed > 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            لوحة التحكم - Gate-N
          </h1>
          <p className="text-muted-foreground mt-1">
            مركز التحكم والإدارة - مراقبة حالة النظام والوظائف
          </p>
        </div>

        {/* Refresh indicator */}
        {isRefetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>جاري التحديث...</span>
          </div>
        )}
      </div>

      {/* System Health Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant={systemHealthy ? 'default' : hasFailedJobs ? 'destructive' : 'secondary'}
          className="text-sm px-3 py-1"
        >
          {systemHealthy ? (
            <>
              <CheckCircle2 className="h-4 w-4 ml-1" />
              النظام يعمل بشكل طبيعي
            </>
          ) : hasFailedJobs ? (
            <>
              <XCircle className="h-4 w-4 ml-1" />
              يوجد وظائف فاشلة
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 ml-1" />
              لا توجد وظائف نشطة
            </>
          )}
        </Badge>

        {hasRunningJobs && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Clock className="h-4 w-4 ml-1 animate-pulse" />
            {jobs.runs_last_24h.running} وظائف قيد التشغيل
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الوظائف
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {jobs.enabled} وظيفة نشطة
            </p>
          </CardContent>
        </Card>

        {/* Successful Runs (24h) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              التشغيلات الناجحة (24 ساعة)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobs.runs_last_24h.succeeded}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              معدل النجاح: {successRate}%
            </p>
          </CardContent>
        </Card>

        {/* Failed Runs (24h) */}
        <Card className={cn(hasFailedJobs && "border-destructive/50")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              التشغيلات الفاشلة (24 ساعة)
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              hasFailedJobs ? "text-destructive" : "text-muted-foreground"
            )}>
              {jobs.runs_last_24h.failed}
            </div>
            {hasFailedJobs && (
              <p className="text-xs text-destructive mt-1">
                يتطلب انتباه فوري
              </p>
            )}
          </CardContent>
        </Card>

        {/* Running Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              قيد التشغيل الآن
            </CardTitle>
            <Clock className={cn(
              "h-4 w-4",
              hasRunningJobs && "text-blue-500 animate-pulse"
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {jobs.runs_last_24h.running}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              وظائف نشطة حالياً
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Jobs Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              أداء الوظائف (آخر 24 ساعة)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">إجمالي التشغيلات</span>
                <span className="font-medium">{totalRuns}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">معدل النجاح</span>
                <Badge variant={successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"}>
                  {successRate}%
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الوظائف النشطة</span>
                <span className="font-medium">{jobs.enabled} من {jobs.total}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>ناجح</span>
                <span>فاشل</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                {totalRuns > 0 && (
                  <>
                    <div
                      className="bg-green-500"
                      style={{ width: `${(jobs.runs_last_24h.succeeded / totalRuns) * 100}%` }}
                    />
                    <div
                      className="bg-destructive"
                      style={{ width: `${(jobs.runs_last_24h.failed / totalRuns) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(jobs.runs_last_24h.running / totalRuns) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">آخر تحديث للإعدادات</span>
                <span className="font-medium">
                  {adminSettings.updated_at 
                    ? new Date(adminSettings.updated_at).toLocaleDateString('ar-SA')
                    : 'غير محدد'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">حالة النظام</span>
                <Badge variant={systemHealthy ? "default" : "secondary"}>
                  {systemHealthy ? 'نشط' : 'يحتاج مراجعة'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">التحديث التلقائي</span>
                <Badge variant="outline">كل 30 ثانية</Badge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">إجراءات سريعة</p>
              <div className="flex gap-2">
                <a
                  href="/admin/gate-n/jobs"
                  className="text-xs text-primary hover:underline"
                >
                  إدارة الوظائف ←
                </a>
                <span className="text-xs text-muted-foreground">•</span>
                <a
                  href="/admin/gate-n/settings"
                  className="text-xs text-primary hover:underline"
                >
                  الإعدادات ←
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          يتم تحديث البيانات تلقائياً كل 30 ثانية. آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
        </AlertDescription>
      </Alert>
    </div>
  );
}
