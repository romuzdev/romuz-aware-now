/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Component: BackupScheduler
 * Purpose: جدولة النسخ الاحتياطي التلقائي
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Switch } from '@/core/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import {
  getBackupSchedules,
  createBackupSchedule,
  toggleBackupSchedule,
  deleteBackupSchedule,
  validateCronExpression,
  type JobType,
} from '@/integrations/supabase/backup';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export function BackupScheduler() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    scheduleName: '',
    jobType: 'full' as JobType,
    cronExpression: '0 2 * * *', // Daily at 2 AM
    description: '',
    retentionDays: 30,
    maxBackupsCount: 10,
  });

  // Fetch schedules
  const { data: schedules, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['backup-schedules'],
    queryFn: getBackupSchedules,
  });

  const handleManualRefresh = async () => {
    await refetch();
    toast({ title: t('backup.scheduler.refreshed'), description: t('backup.scheduler.refreshDescription') });
  };

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: () => createBackupSchedule({
      scheduleName: newSchedule.scheduleName,
      jobType: newSchedule.jobType,
      cronExpression: newSchedule.cronExpression,
      description: newSchedule.description,
      retentionDays: newSchedule.retentionDays,
      maxBackupsCount: newSchedule.maxBackupsCount,
      notifyOnFailure: true,
    }),
    onSuccess: () => {
      toast({
        title: t('backup.scheduler.scheduleCreated'),
        description: t('backup.scheduler.scheduleCreatedDescription'),
      });
      setCreateDialogOpen(false);
      setNewSchedule({
        scheduleName: '',
        jobType: 'full',
        cronExpression: '0 2 * * *',
        description: '',
        retentionDays: 30,
        maxBackupsCount: 10,
      });
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('backup.scheduler.scheduleFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle schedule mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      toggleBackupSchedule(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBackupSchedule(id),
    onSuccess: () => {
      toast({
        title: t('backup.scheduler.deleteSuccess'),
        description: t('backup.scheduler.deleteDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cron expression presets
  const cronPresets = [
    { label: t('backup.scheduler.presets.daily'), value: '0 2 * * *' },
    { label: t('backup.scheduler.presets.weekly'), value: '0 2 * * 0' },
    { label: t('backup.scheduler.presets.monthly'), value: '0 2 1 * *' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('backup.scheduler.title')}
              </CardTitle>
              <CardDescription>
                {t('backup.scheduler.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} ${isFetching ? 'animate-spin' : ''}`} />
                {t('backup.scheduler.refresh')}
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('backup.scheduler.newSchedule')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : !schedules || schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('common.noData')}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحالة</TableHead>
                    <TableHead>اسم الجدولة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الجدول الزمني</TableHead>
                    <TableHead>آخر تنفيذ</TableHead>
                    <TableHead>التنفيذ التالي</TableHead>
                    <TableHead>الاحتفاظ</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Switch
                          checked={schedule.is_enabled}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: schedule.id, isEnabled: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {schedule.schedule_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{schedule.job_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {schedule.cron_expression}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {schedule.last_run_at
                          ? format(new Date(schedule.last_run_at), 'PPp', { locale: ar })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {schedule.next_run_at
                          ? format(new Date(schedule.next_run_at), 'PPp', { locale: ar })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {schedule.retention_days} يوم
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Schedule Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء جدولة جديدة</DialogTitle>
            <DialogDescription>
              قم بإعداد جدولة تلقائية للنسخ الاحتياطي
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleName">اسم الجدولة *</Label>
                <Input
                  id="scheduleName"
                  placeholder="نسخ يومي"
                  value={newSchedule.scheduleName}
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduleName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">نوع النسخة</Label>
                <Select
                  value={newSchedule.jobType}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, jobType: value as JobType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">نسخة كاملة</SelectItem>
                    <SelectItem value="incremental">نسخة تزايدية</SelectItem>
                    <SelectItem value="snapshot">لقطة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cronExpression">الجدول الزمني (Cron)</Label>
              <Select
                value={newSchedule.cronExpression}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, cronExpression: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cronPresets.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label} ({preset.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                أو أدخل تعبير Cron مخصص (مثال: 0 2 * * * للتشغيل يومياً الساعة 2 صباحاً)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retentionDays">فترة الاحتفاظ (بالأيام)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  min="1"
                  value={newSchedule.retentionDays}
                  onChange={(e) => setNewSchedule({ ...newSchedule, retentionDays: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBackupsCount">الحد الأقصى للنسخ</Label>
                <Input
                  id="maxBackupsCount"
                  type="number"
                  min="1"
                  value={newSchedule.maxBackupsCount}
                  onChange={(e) => setNewSchedule({ ...newSchedule, maxBackupsCount: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                placeholder="وصف الجدولة"
                value={newSchedule.description}
                onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newSchedule.scheduleName || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 ml-2" />
                  إنشاء جدولة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
