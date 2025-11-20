/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Component: RestoreWizard
 * Purpose: معالج استعادة البيانات
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Progress } from '@/core/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Label } from '@/core/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Database,
  Info,
  Loader2,
} from 'lucide-react';
import {
  getBackupJobs,
  restoreFromBackup,
  formatBytes,
  getRestoreLogById,
  type BackupJob,
  type RestoreType,
} from '@/integrations/supabase/backup';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function RestoreWizard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupJob | null>(null);
  const [restoreType, setRestoreType] = useState<RestoreType>('full');
  const [understandRisks, setUnderstandRisks] = useState(false);
  const [restoreLogId, setRestoreLogId] = useState<string | null>(null);

  // Fetch completed backups only
  const { data: backups, isLoading } = useQuery({
    queryKey: ['completed-backups'],
    queryFn: () => getBackupJobs({ status: 'completed', limit: 20 }),
  });

  // Poll restore progress
  const { data: restoreLog, isLoading: isPolling } = useQuery({
    queryKey: ['restore-log', restoreLogId],
    queryFn: () => getRestoreLogById(restoreLogId!),
    enabled: !!restoreLogId && progressDialogOpen,
    refetchInterval: (query) => {
      // Stop polling when completed or failed
      const log = query.state.data;
      if (log?.status === 'completed' || log?.status === 'failed') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
  });

  // Show completion toast when restore finishes
  useEffect(() => {
    if (restoreLog && restoreLog.status === 'completed') {
      toast({
        title: '✅ اكتملت الاستعادة بنجاح',
        description: `تم استعادة ${restoreLog.tables_restored || 0} جداول بنجاح`,
      });
      setTimeout(() => {
        setProgressDialogOpen(false);
        setRestoreLogId(null);
        queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      }, 2000);
    } else if (restoreLog && restoreLog.status === 'failed') {
      toast({
        title: '❌ فشلت عملية الاستعادة',
        description: restoreLog.error_message || 'حدث خطأ أثناء الاستعادة',
        variant: 'destructive',
      });
      setTimeout(() => {
        setProgressDialogOpen(false);
        setRestoreLogId(null);
      }, 3000);
    }
  }, [restoreLog?.status]);

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: () => {
      if (!selectedBackup) throw new Error('No backup selected');
      return restoreFromBackup(selectedBackup.id, restoreType);
    },
    onSuccess: (data) => {
      setConfirmDialogOpen(false);
      setProgressDialogOpen(true);
      setRestoreLogId(data.restoreLogId);
      setSelectedBackup(null);
      setUnderstandRisks(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل بدء الاستعادة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSelectBackup = (backupId: string) => {
    const backup = backups?.find(b => b.id === backupId);
    if (backup) {
      setSelectedBackup(backup);
      setRestoreDialogOpen(true);
    }
  };

  const handleContinueToConfirm = () => {
    setRestoreDialogOpen(false);
    setConfirmDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            استعادة البيانات
          </CardTitle>
          <CardDescription>
            استعادة البيانات من نسخة احتياطية سابقة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تحذير هام</AlertTitle>
            <AlertDescription>
              عملية الاستعادة ستقوم بحذف البيانات الحالية واستبدالها بالبيانات من النسخة الاحتياطية المحددة.
              تأكد من إنشاء نسخة احتياطية حديثة قبل المتابعة.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              جاري التحميل...
            </div>
          ) : !backups || backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد نسخ احتياطية متاحة للاستعادة</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>اختر النسخة الاحتياطية</Label>
              <Select onValueChange={handleSelectBackup}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نسخة احتياطية..." />
                </SelectTrigger>
                <SelectContent>
                  {backups.map((backup) => (
                    <SelectItem key={backup.id} value={backup.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span className="font-medium">{backup.backup_name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{backup.job_type}</Badge>
                          <span>{formatBytes(backup.backup_size_bytes || 0)}</span>
                          <span>{format(new Date(backup.created_at), 'PP', { locale: ar })}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Configuration Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعداد الاستعادة</DialogTitle>
            <DialogDescription>
              قم بتكوين إعدادات الاستعادة
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4 py-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>معلومات النسخة الاحتياطية</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>الاسم:</span>
                      <span className="font-medium">{selectedBackup.backup_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>النوع:</span>
                      <Badge variant="outline">{selectedBackup.job_type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>الحجم:</span>
                      <span>{formatBytes(selectedBackup.backup_size_bytes || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد الجداول:</span>
                      <span>{selectedBackup.tables_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد السجلات:</span>
                      <span>{selectedBackup.rows_count?.toLocaleString('ar-SA')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>التاريخ:</span>
                      <span>{format(new Date(selectedBackup.created_at), 'PPp', { locale: ar })}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="restoreType">نوع الاستعادة</Label>
                <Select
                  value={restoreType}
                  onValueChange={(value) => setRestoreType(value as RestoreType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">استعادة كاملة</SelectItem>
                    <SelectItem value="partial">استعادة جزئية</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  الاستعادة الكاملة: استعادة جميع البيانات<br />
                  الاستعادة الجزئية: اختيار جداول محددة (قريباً)
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleContinueToConfirm}>
              المتابعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأكيد الاستعادة
            </DialogTitle>
            <DialogDescription>
              هذا الإجراء لا يمكن التراجع عنه
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>تحذير!</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>سيتم حذف جميع البيانات الحالية</li>
                  <li>سيتم استبدالها بالبيانات من النسخة الاحتياطية</li>
                  <li>قد تستغرق العملية عدة دقائق</li>
                  <li>يُنصح بإنشاء نسخة احتياطية حالية قبل المتابعة</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="understand"
                checked={understandRisks}
                onCheckedChange={(checked) => setUnderstandRisks(checked as boolean)}
              />
              <Label
                htmlFor="understand"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                أفهم المخاطر وأرغب في المتابعة
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setConfirmDialogOpen(false);
              setRestoreDialogOpen(true);
            }}>
              رجوع
            </Button>
            <Button
              variant="destructive"
              onClick={() => restoreMutation.mutate()}
              disabled={!understandRisks || restoreMutation.isPending}
            >
              {restoreMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري الاستعادة...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 ml-2" />
                  تأكيد الاستعادة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري استعادة البيانات
            </DialogTitle>
            <DialogDescription>
              يرجى الانتظار حتى تكتمل العملية
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {restoreLog ? (
              <>
                {/* Status Badge */}
                <div className="flex justify-center">
                  {restoreLog.status === 'running' && (
                    <Badge variant="outline" className="px-4 py-2">
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      قيد التنفيذ
                    </Badge>
                  )}
                  {restoreLog.status === 'completed' && (
                    <Badge className="px-4 py-2 bg-success text-success-foreground">
                      <CheckCircle className="h-4 w-4 ml-2" />
                      اكتملت بنجاح
                    </Badge>
                  )}
                  {restoreLog.status === 'failed' && (
                    <Badge variant="destructive" className="px-4 py-2">
                      <AlertTriangle className="h-4 w-4 ml-2" />
                      فشلت
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                {restoreLog.status === 'running' && (
                  <div className="space-y-2">
                    <Progress value={undefined} className="h-2" />
                    <p className="text-sm text-center text-muted-foreground">
                      جاري معالجة البيانات...
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">الجداول المستعادة</div>
                    <div className="text-lg font-semibold">{restoreLog.tables_restored || 0}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">السجلات المستعادة</div>
                    <div className="text-lg font-semibold">
                      {(restoreLog.rows_restored || 0).toLocaleString('ar-SA')}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                {restoreLog.duration_seconds && (
                  <div className="text-center text-sm text-muted-foreground">
                    المدة: {restoreLog.duration_seconds} ثانية
                  </div>
                )}

                {/* Error Message */}
                {restoreLog.status === 'failed' && restoreLog.error_message && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {restoreLog.error_message}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {restoreLog && (restoreLog.status === 'completed' || restoreLog.status === 'failed') && (
            <DialogFooter>
              <Button 
                onClick={() => {
                  setProgressDialogOpen(false);
                  setRestoreLogId(null);
                }}
              >
                إغلاق
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
