/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Component: BackupMonitoring
 * Purpose: لوحة مراقبة النسخ الاحتياطي والأداء
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  TrendingUp,
  XCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { getBackupJobs, formatBytes, getRestoreLogs } from '@/integrations/supabase/backup';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface BackupStats {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  totalSize: number;
  avgDuration: number;
  successRate: number;
}

interface StorageInfo {
  used: number;
  limit: number;
  percentage: number;
}

export function BackupMonitoring() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  
  // Fetch automation status
  const { data: automationStatus } = useQuery({
    queryKey: ['backup-automation-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('id, schedule_name, is_enabled, last_run_at, last_run_status, next_run_at')
        .eq('is_enabled', true);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch recent backups
  const { data: recentBackups, refetch: refetchBackups, isFetching: isFetchingBackups } = useQuery({
    queryKey: ['recent-backups'],
    queryFn: () => getBackupJobs({ limit: 10 }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch restore logs
  const { data: restoreLogs, refetch: refetchRestoreLogs, isFetching: isFetchingRestoreLogs } = useQuery({
    queryKey: ['restore-logs'],
    queryFn: () => getRestoreLogs(10),
    refetchInterval: 30000,
  });

  const isRefreshing = isFetchingBackups || isFetchingRestoreLogs;

  const handleRefresh = async () => {
    await Promise.all([refetchBackups(), refetchRestoreLogs()]);
    toast({ title: t('backup.monitoring.refreshed'), description: t('backup.monitoring.refreshDescription') });
  };

  // Fetch backup statistics
  const { data: stats } = useQuery<BackupStats>({
    queryKey: ['backup-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('status, backup_size_bytes, duration_seconds');

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(b => b.status === 'completed').length;
      const failed = data.filter(b => b.status === 'failed').length;
      const totalSize = data
        .filter(b => b.backup_size_bytes)
        .reduce((sum, b) => sum + (b.backup_size_bytes || 0), 0);
      const avgDuration = data
        .filter(b => b.duration_seconds)
        .reduce((sum, b) => sum + (b.duration_seconds || 0), 0) / (completed || 1);
      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        totalBackups: total,
        completedBackups: completed,
        failedBackups: failed,
        totalSize,
        avgDuration,
        successRate,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch storage information
  const { data: storageInfo } = useQuery<StorageInfo>({
    queryKey: ['storage-info'],
    queryFn: async () => {
      // Mock data - في الواقع يجب جلبها من إعدادات المستأجر
      const used = stats?.totalSize || 0;
      const limit = 10 * 1024 * 1024 * 1024; // 10 GB
      const percentage = (used / limit) * 100;

      return { used, limit, percentage };
    },
    enabled: !!stats,
  });

  // Fetch failed backups
  const { data: failedBackups } = useQuery({
    queryKey: ['failed-backups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      {/* Automation Status Alert */}
      {automationStatus && automationStatus.length > 0 && (
        <Alert className="mb-4">
          <Activity className="h-4 w-4" />
          <AlertTitle>{t('backup.monitoring.automation.title')}</AlertTitle>
          <AlertDescription>
            {t('backup.monitoring.automation.active')}: {automationStatus.length} {t('backup.monitoring.automation.schedules')}
            {automationStatus.some(s => s.last_run_status === 'failed') && (
              <span className="text-destructive ml-2">
                • {automationStatus.filter(s => s.last_run_status === 'failed').length} {t('backup.monitoring.automation.failed')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('backup.monitoring.statistics.totalBackups')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBackups || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedBackups || 0} {t('backup.monitoring.statistics.completedBackups')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('backup.monitoring.statistics.successRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.failedBackups || 0} {t('backup.monitoring.statistics.failedBackups')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('backup.monitoring.statistics.totalSize')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats?.totalSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {storageInfo?.percentage.toFixed(1)}% مستخدم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط المدة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgDuration.toFixed(0)}s
            </div>
            <p className="text-xs text-muted-foreground">
              في آخر 30 يوم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            حالة النظام
          </CardTitle>
          <CardDescription>مؤشرات صحة نظام النسخ الاحتياطي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Alert variant={stats?.successRate && stats.successRate > 95 ? 'default' : 'destructive'}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>معدل النجاح</AlertTitle>
              <AlertDescription>
                {stats?.successRate && stats.successRate > 95
                  ? '✅ ممتاز - فوق 95%'
                  : '⚠️ يحتاج انتباه - أقل من 95%'}
              </AlertDescription>
            </Alert>

            <Alert variant={storageInfo && storageInfo.percentage < 80 ? 'default' : 'destructive'}>
              <HardDrive className="h-4 w-4" />
              <AlertTitle>مساحة التخزين</AlertTitle>
              <AlertDescription>
                {storageInfo && storageInfo.percentage < 80
                  ? '✅ مساحة كافية'
                  : '⚠️ مساحة محدودة - يُنصح بالتنظيف'}
              </AlertDescription>
            </Alert>

            <Alert variant={stats?.failedBackups === 0 ? 'default' : 'destructive'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>النسخ الفاشلة</AlertTitle>
              <AlertDescription>
                {stats?.failedBackups === 0
                  ? '✅ لا توجد أخطاء'
                  : `⚠️ ${stats?.failedBackups} عملية فاشلة`}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Recent Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>آخر النسخ الاحتياطية</CardTitle>
              <CardDescription>آخر 10 عمليات نسخ احتياطي</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>الحجم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBackups?.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.backup_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        backup.status === 'completed'
                          ? 'default'
                          : backup.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {backup.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {backup.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                      {backup.status === 'running' && <Clock className="h-3 w-3 mr-1" />}
                      {backup.status === 'completed'
                        ? 'مكتمل'
                        : backup.status === 'failed'
                        ? 'فشل'
                        : 'قيد التنفيذ'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(backup.created_at), 'PPp', { locale: ar })}
                  </TableCell>
                  <TableCell>{backup.duration_seconds}s</TableCell>
                  <TableCell>{formatBytes(backup.backup_size_bytes || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restore Logs */}
      {restoreLogs && restoreLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              سجل عمليات الاستعادة
            </CardTitle>
            <CardDescription>آخر عمليات استعادة البيانات</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النسخة الاحتياطية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الجداول</TableHead>
                  <TableHead>السجلات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restoreLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.backup_jobs?.backup_name || 'غير معروف'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === 'completed'
                            ? 'default'
                            : log.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {log.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {log.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                        {log.status === 'running' && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                        {log.status === 'completed'
                          ? 'مكتمل'
                          : log.status === 'failed'
                          ? 'فشل'
                          : 'قيد التنفيذ'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.created_at), 'PPp', { locale: ar })}
                    </TableCell>
                    <TableCell>{log.tables_restored || 0}</TableCell>
                    <TableCell>{(log.rows_restored || 0).toLocaleString('ar-SA')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Failed Backups Alert */}
      {failedBackups && failedBackups.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيه: نسخ احتياطية فاشلة</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {failedBackups.map((backup) => (
                <div key={backup.id} className="text-sm">
                  <strong>{backup.backup_name}</strong>:{' '}
                  {backup.error_message || 'خطأ غير معروف'}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
