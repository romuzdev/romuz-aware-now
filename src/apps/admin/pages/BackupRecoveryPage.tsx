/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Page: Backup & Recovery Management
 * Purpose: الصفحة الرئيسية لإدارة النسخ الاحتياطي والاستعادة
 * ============================================================================
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { BackupManager, BackupScheduler, RestoreWizard, BackupMonitoring, DisasterRecoveryPlanner, RecoveryTestRunner } from '@/modules/backup';
import { PITRWizard } from '@/modules/backup/components/PITRWizard';
import { TransactionLogViewer } from '@/modules/backup/components/TransactionLogViewer';
import { Database, Calendar, RotateCcw, Activity, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BackupRecoveryPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          {t('backup.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('backup.description')}
        </p>
      </div>

      <Tabs defaultValue="backups" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="backups" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t('backup.tabs.backups')}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('backup.tabs.schedules')}
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            {t('backup.tabs.restore')}
          </TabsTrigger>
          <TabsTrigger value="pitr" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('backup.tabs.pitr')}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('backup.tabs.logs')}
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('backup.tabs.monitoring')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4 mt-6">
          <BackupManager />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4 mt-6">
          <BackupScheduler />
        </TabsContent>

        <TabsContent value="restore" className="space-y-4 mt-6">
          <RestoreWizard />
        </TabsContent>

        <TabsContent value="pitr" className="space-y-4 mt-6">
          <PITRWizard />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-6">
          <TransactionLogViewer />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4 mt-6">
          <BackupMonitoring />
        </TabsContent>

        <TabsContent value="dr-plans" className="space-y-4 mt-6">
          <DisasterRecoveryPlanner />
        </TabsContent>

        <TabsContent value="tests" className="space-y-4 mt-6">
          <RecoveryTestRunner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
