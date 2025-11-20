/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Component: PITRWizard
 * Purpose: معالج استعادة البيانات لنقطة زمنية محددة (Point-in-Time Recovery)
 * ============================================================================
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Calendar,
  ArrowRight,
  FileText,
  Loader2,
} from 'lucide-react';
import { 
  getBackupJobs,
  executePITR,
  getPITRPreview,
  getPITRStats,
  type BackupJob,
  type PITRResult,
  type PITRStats,
} from '@/integrations/supabase/backup';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export function PITRWizard() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [step, setStep] = useState(1); // 1: Select Time, 2: Preview, 3: Confirm
  const [selectedBackup, setSelectedBackup] = useState<BackupJob | null>(null);
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<PITRResult | null>(null);
  const [pitrStats, setPitrStats] = useState<PITRStats | null>(null);
  const [understandRisks, setUnderstandRisks] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch available backups
  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ['full-backups-for-pitr'],
    queryFn: () => getBackupJobs({ status: 'completed', limit: 20 }),
  });

  const fullBackups = backups?.filter(b => b.job_type === 'full') || [];

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!targetDate || !targetTime) {
        throw new Error('Please select target date and time');
      }

      const targetTimestamp = `${targetDate}T${targetTime}:00.000Z`;
      
      // Get stats first
      const stats = await getPITRStats(
        targetTimestamp,
        selectedBackup?.created_at
      );
      setPitrStats(stats);

      // Get preview
      const preview = await getPITRPreview(
        targetTimestamp,
        selectedBackup?.id,
        selectedTables.length > 0 ? selectedTables : undefined
      );
      
      return preview;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setStep(2);
      toast({
        title: t('backup.pitr.previewReady'),
        description: t('backup.pitr.previewReadyDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('backup.pitr.previewFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Execute PITR mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!targetDate || !targetTime || !understandRisks) {
        throw new Error('Please confirm all requirements');
      }

      const targetTimestamp = `${targetDate}T${targetTime}:00.000Z`;
      
      return executePITR({
        targetTimestamp,
        baseBackupId: selectedBackup?.id,
        tables: selectedTables.length > 0 ? selectedTables : undefined,
        dryRun: false,
        confirmRestore: true,
      });
    },
    onSuccess: () => {
      toast({
        title: t('backup.pitr.restoreStarted'),
        description: t('backup.pitr.restoreStartedDescription'),
      });
      setConfirmDialogOpen(false);
      resetWizard();
    },
    onError: (error: Error) => {
      toast({
        title: t('backup.pitr.restoreFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetWizard = () => {
    setStep(1);
    setSelectedBackup(null);
    setTargetDate('');
    setTargetTime('');
    setSelectedTables([]);
    setPreviewData(null);
    setPitrStats(null);
    setUnderstandRisks(false);
  };

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  if (backupsLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!fullBackups || fullBackups.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('backup.pitr.noBackups')}</AlertTitle>
        <AlertDescription>
          {t('backup.pitr.noBackupsDescription')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`rounded-full w-8 h-8 flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="text-sm font-medium">{t('backup.pitr.steps.selectTime')}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`rounded-full w-8 h-8 flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span className="text-sm font-medium">{t('backup.pitr.steps.preview')}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`rounded-full w-8 h-8 flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="text-sm font-medium">{t('backup.pitr.steps.confirm')}</span>
        </div>
      </div>

      {/* Step 1: Select Time */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('backup.pitr.selectTargetTime')}
            </CardTitle>
            <CardDescription>
              {t('backup.pitr.selectTargetTimeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base Backup Selection */}
            <div className="space-y-2">
              <Label>{t('backup.pitr.baseBackup')}</Label>
              <Select
                value={selectedBackup?.id || ''}
                onValueChange={(value) => {
                  const backup = fullBackups.find(b => b.id === value);
                  setSelectedBackup(backup || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('backup.pitr.selectBaseBackup')} />
                </SelectTrigger>
                <SelectContent>
                  {fullBackups.map((backup) => (
                    <SelectItem key={backup.id} value={backup.id}>
                      {backup.backup_name} - {format(new Date(backup.created_at), 'PPP p', { locale: i18n.language === 'ar' ? ar : undefined })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="target-date">{t('backup.pitr.targetDate')}</Label>
              <input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Target Time */}
            <div className="space-y-2">
              <Label htmlFor="target-time">{t('backup.pitr.targetTime')}</Label>
              <input
                id="target-time"
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={resetWizard} variant="outline">
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => previewMutation.mutate()}
                disabled={!selectedBackup || !targetDate || !targetTime || previewMutation.isPending}
              >
                {previewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('backup.pitr.preview')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview Changes */}
      {step === 2 && previewData && pitrStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('backup.pitr.previewChanges')}
            </CardTitle>
            <CardDescription>
              {t('backup.pitr.previewChangesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{pitrStats.totalOperations}</div>
                <div className="text-sm text-muted-foreground">{t('backup.pitr.stats.totalOperations')}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{pitrStats.insertCount}</div>
                <div className="text-sm text-muted-foreground">{t('backup.pitr.stats.inserts')}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{pitrStats.updateCount}</div>
                <div className="text-sm text-muted-foreground">{t('backup.pitr.stats.updates')}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{pitrStats.deleteCount}</div>
                <div className="text-sm text-muted-foreground">{t('backup.pitr.stats.deletes')}</div>
              </div>
            </div>

            {/* Affected Tables */}
            <div className="space-y-2">
              <Label>{t('backup.pitr.affectedTables')}</Label>
              <div className="flex flex-wrap gap-2">
                {pitrStats.affectedTables.map((table) => (
                  <Badge key={table} variant="outline">{table}</Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={() => setStep(1)} variant="outline">
                {t('common.back')}
              </Button>
              <Button onClick={() => setStep(3)}>
                {t('common.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('backup.pitr.confirmRestore')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('backup.pitr.warning')}</AlertTitle>
              <AlertDescription>
                {t('backup.pitr.warningDescription')}
              </AlertDescription>
            </Alert>

            {/* Confirmation Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="understand-risks"
                checked={understandRisks}
                onCheckedChange={(checked) => setUnderstandRisks(checked as boolean)}
              />
              <Label htmlFor="understand-risks" className="text-sm cursor-pointer">
                {t('backup.pitr.understandRisks')}
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={() => setStep(2)} variant="outline">
                {t('common.back')}
              </Button>
              <Button
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!understandRisks}
                variant="destructive"
              >
                {t('backup.pitr.executeRestore')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('backup.pitr.finalConfirmation')}</DialogTitle>
            <DialogDescription>
              {t('backup.pitr.finalConfirmationDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConfirmDialogOpen(false)} variant="outline">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              variant="destructive"
            >
              {executeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
