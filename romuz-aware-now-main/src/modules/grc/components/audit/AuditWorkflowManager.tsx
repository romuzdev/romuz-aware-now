/**
 * Audit Workflow Manager
 * M12: Manages audit workflow stages and assignments
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Textarea } from '@/core/components/ui/textarea';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useWorkflowProgress,
  useUpdateWorkflowStage,
  useAssignWorkflow,
  useCompleteWorkflow,
} from '@/modules/grc/hooks/useAuditWorkflows';
import type { WorkflowType } from '@/modules/grc/types/audit-workflow.types';
import { WORKFLOW_STAGES } from '@/modules/grc/types/audit-workflow.types';

interface AuditWorkflowManagerProps {
  auditId: string;
}

const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  planning: 'التخطيط',
  execution: 'التنفيذ',
  reporting: 'إعداد التقارير',
  followup: 'المتابعة',
};

const STAGE_LABELS: Record<string, string> = {
  // Planning stages
  scope_definition: 'تحديد النطاق',
  risk_assessment: 'تقييم المخاطر',
  resource_allocation: 'تخصيص الموارد',
  planning_approval: 'الموافقة على الخطة',
  
  // Execution stages
  fieldwork: 'العمل الميداني',
  evidence_collection: 'جمع الأدلة',
  testing_controls: 'اختبار الضوابط',
  
  // Reporting stages
  draft_preparation: 'إعداد المسودة',
  management_review: 'المراجعة الإدارية',
  final_report: 'التقرير النهائي',
  
  // Followup stages
  action_tracking: 'تتبع الإجراءات',
  verification: 'التحقق',
  closure: 'الإغلاق',
};

export function AuditWorkflowManager({ auditId }: AuditWorkflowManagerProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>('planning');
  const [notes, setNotes] = useState<string>('');

  const { data: workflowProgress, isLoading } = useWorkflowProgress(auditId);
  const updateStageMutation = useUpdateWorkflowStage();
  const assignWorkflowMutation = useAssignWorkflow();
  const completeWorkflowMutation = useCompleteWorkflow();

  const currentWorkflow = workflowProgress?.find(w => w.workflow_type === selectedWorkflow);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'on_hold':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'on_hold':
        return 'معلق';
      case 'pending':
        return 'في الانتظار';
      case 'cancelled':
        return 'ملغى';
      default:
        return status;
    }
  };

  const handleStageChange = async (stage: string) => {
    if (!currentWorkflow) return;

    const stages = WORKFLOW_STAGES[selectedWorkflow];
    const stageIndex = stages.indexOf(stage);
    const progressPct = Math.round(((stageIndex + 1) / stages.length) * 100);

    await updateStageMutation.mutateAsync({
      workflowId: (currentWorkflow as any).id,
      stage,
      progressPct,
    });
  };

  const handleComplete = async () => {
    if (!currentWorkflow) return;
    await completeWorkflowMutation.mutateAsync({
      workflowId: (currentWorkflow as any).id,
      notes,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة سير عمل التدقيق</CardTitle>
        <CardDescription>
          تتبع وإدارة مراحل التدقيق المختلفة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedWorkflow} onValueChange={(v) => setSelectedWorkflow(v as WorkflowType)}>
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(WORKFLOW_TYPE_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(WORKFLOW_TYPE_LABELS).map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {currentWorkflow ? (
                <>
                  {/* Status Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">الحالة</p>
                      <Badge className={getStatusColor(currentWorkflow.status)}>
                        {getStatusLabel(currentWorkflow.status)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">المرحلة الحالية</p>
                      <p className="font-medium">
                        {STAGE_LABELS[currentWorkflow.current_stage] || currentWorkflow.current_stage}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
                      <div className="flex items-center gap-2">
                        <Progress value={currentWorkflow.progress_pct} className="flex-1" />
                        <span className="text-sm font-medium">{currentWorkflow.progress_pct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Due Date Warning */}
                  {currentWorkflow.is_overdue && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive">
                        تجاوز الموعد النهائي: {currentWorkflow.due_date}
                      </p>
                    </div>
                  )}

                  {/* Stage Progress Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">مراحل سير العمل</h4>
                    <div className="space-y-2">
                      {WORKFLOW_STAGES[type as WorkflowType].map((stage, index) => {
                        const isCurrentStage = currentWorkflow.current_stage === stage;
                        const isCompletedStage = WORKFLOW_STAGES[type as WorkflowType].indexOf(currentWorkflow.current_stage) > index;

                        return (
                          <div
                            key={stage}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                              isCurrentStage && "border-primary bg-primary/5",
                              isCompletedStage && "border-green-500/50 bg-green-50 dark:bg-green-950/20"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                              isCompletedStage && "bg-green-500 text-white",
                              isCurrentStage && "bg-primary text-primary-foreground",
                              !isCurrentStage && !isCompletedStage && "bg-muted"
                            )}>
                              {isCompletedStage ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-sm">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={cn(
                                "text-sm",
                                isCurrentStage && "font-medium"
                              )}>
                                {STAGE_LABELS[stage] || stage}
                              </p>
                            </div>
                            {isCurrentStage && currentWorkflow.status !== 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const nextStageIndex = index + 1;
                                  if (nextStageIndex < WORKFLOW_STAGES[type as WorkflowType].length) {
                                    handleStageChange(WORKFLOW_STAGES[type as WorkflowType][nextStageIndex]);
                                  }
                                }}
                                disabled={updateStageMutation.isPending}
                              >
                                <Play className="h-4 w-4 ml-2" />
                                إكمال المرحلة
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  {currentWorkflow.status !== 'completed' && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ملاحظات</label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="أضف ملاحظات حول التقدم..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleComplete}
                          disabled={completeWorkflowMutation.isPending || currentWorkflow.progress_pct < 100}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 ml-2" />
                          إتمام سير العمل
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لم يتم إنشاء سير عمل لهذا النوع بعد</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
