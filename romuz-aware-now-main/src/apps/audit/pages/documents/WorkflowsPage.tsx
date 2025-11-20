/**
 * Audit Documents - Workflow Automation Page
 * 
 * Manage workflow automation rules for audit documents
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { WorkflowRulesManager, WorkflowExecutionLog } from '@/modules/documents';
import { useWorkflowStatistics } from '@/modules/documents/hooks/useDocumentWorkflows';

export function AuditDocumentsWorkflowsPage() {
  const { t } = useTranslation();
  const { data: stats } = useWorkflowStatistics();

  useEffect(() => {
    document.title = 'Audit - Workflow Automation';
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">إدارة سير العمل الآلي</h1>
          <p className="text-muted-foreground mt-1">
            تكوين قواعد التشغيل الآلي لوثائق التدقيق
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي التنفيذ</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>نجح</CardDescription>
              <CardTitle className="text-3xl text-success">{stats.success}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>فشل</CardDescription>
              <CardTitle className="text-3xl text-destructive">{stats.failed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>متوسط الوقت</CardDescription>
              <CardTitle className="text-3xl">{stats.avg_duration_ms}ms</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Workflow Rules Manager */}
      <WorkflowRulesManager />

      {/* Execution Log */}
      <WorkflowExecutionLog />
    </div>
  );
}
