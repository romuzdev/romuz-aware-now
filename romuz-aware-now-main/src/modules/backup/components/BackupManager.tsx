/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Component: BackupManager
 * Purpose: إدارة النسخ الاحتياطية
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
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
import { 
  Database, 
  Download, 
  Trash2, 
  MoreVertical, 
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  getBackupJobs,
  createBackupJob,
  deleteBackupJob,
  downloadBackupFile,
  formatBytes,
  formatDuration,
  getStatusColor,
  type BackupJob,
  type JobType,
} from '@/integrations/supabase/backup';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export function BackupManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBackup, setNewBackup] = useState({
    jobType: 'full' as JobType,
    backupName: '',
    description: '',
  });

  // Fetch backups
  const { data: backups, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['backup-jobs'],
    queryFn: () => getBackupJobs({ limit: 50 }),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const handleManualRefresh = async () => {
    await refetch();
    toast({
      title: t('backup.manager.refreshed'),
      description: t('backup.manager.refreshDescription'),
    });
  };

  // Create backup mutation
  const createMutation = useMutation({
    mutationFn: () => createBackupJob(
      newBackup.jobType,
      newBackup.backupName || undefined,
      newBackup.description || undefined
    ),
    onSuccess: () => {
      toast({
        title: t('backup.manager.backupStarted'),
        description: t('backup.manager.backupStartedDescription'),
      });
      setCreateDialogOpen(false);
      setNewBackup({ jobType: 'full', backupName: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('backup.manager.backupFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete backup mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBackupJob(id),
    onSuccess: () => {
      toast({
        title: t('backup.manager.deleteSuccess'),
        description: t('backup.manager.deleteDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Download backup
  const handleDownload = async (backup: BackupJob) => {
    if (!backup.storage_path) return;
    
    try {
      const blob = await downloadBackupFile(backup.storage_path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.backup_name}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: t('backup.manager.downloadSuccess'),
        description: t('backup.manager.downloadDescription'),
      });
    } catch (error) {
      toast({
        title: t('backup.manager.downloadFailed'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      });
    }
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-warning animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t('backup.manager.title')}
              </CardTitle>
              <CardDescription>
                {t('backup.manager.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isFetching ? 'animate-spin' : ''}`} />
                {t('backup.manager.refresh')}
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                {t('backup.manager.newBackup')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : !backups || backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('common.noData')}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('backup.manager.table.status')}</TableHead>
                    <TableHead>{t('backup.manager.table.name')}</TableHead>
                    <TableHead>{t('backup.manager.table.type')}</TableHead>
                    <TableHead>{t('backup.manager.table.size')}</TableHead>
                    <TableHead>{t('backup.manager.table.duration')}</TableHead>
                    <TableHead>{t('backup.manager.table.created')}</TableHead>
                    <TableHead className="text-left">{t('backup.manager.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(backup.status)}
                          <Badge variant={getStatusColor(backup.status) as any}>
                            {t(`backup.manager.status.${backup.status}`)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {backup.backup_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(`backup.manager.types.${backup.job_type}`)}</Badge>
                      </TableCell>
                      <TableCell>
                        {backup.backup_size_bytes ? formatBytes(backup.backup_size_bytes) : '-'}
                      </TableCell>
                      <TableCell>
                        {backup.duration_seconds ? formatDuration(backup.duration_seconds) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(backup.created_at), 'PPp', { locale: i18n.language === 'ar' ? ar : undefined })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {backup.status === 'completed' && backup.storage_path && (
                              <DropdownMenuItem onClick={() => handleDownload(backup)}>
                                <Download className="h-4 w-4 ml-2" />
                                {t('backup.manager.actions.download')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(backup.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              {t('backup.manager.actions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('backup.manager.createBackup')}</DialogTitle>
            <DialogDescription>
              {t('backup.manager.createDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jobType">{t('backup.manager.backupType')}</Label>
              <Select
                value={newBackup.jobType}
                onValueChange={(value) => setNewBackup({ ...newBackup, jobType: value as JobType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">{t('backup.manager.types.full')}</SelectItem>
                  <SelectItem value="incremental">{t('backup.manager.types.incremental')}</SelectItem>
                  <SelectItem value="snapshot">{t('backup.manager.types.differential')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupName">{t('backup.manager.backupName')}</Label>
              <Input
                id="backupName"
                placeholder={t('backup.manager.backupNamePlaceholder')}
                value={newBackup.backupName}
                onChange={(e) => setNewBackup({ ...newBackup, backupName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('backup.manager.backupDescription')}</Label>
              <Textarea
                id="description"
                placeholder={t('backup.manager.backupDescriptionPlaceholder')}
                value={newBackup.description}
                onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} animate-spin`} />
                  {t('backup.manager.creating')}
                </>
              ) : (
                <>
                  <Database className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('backup.manager.startBackup')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
