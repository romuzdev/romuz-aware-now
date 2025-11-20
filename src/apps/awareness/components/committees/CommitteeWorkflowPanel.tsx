/**
 * D4 Enhancement: Committee Workflow Panel
 * Display and manage committee workflows
 */

import { useState } from 'react';
import { Plus, Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useWorkflows, useStartWorkflow, useCompleteWorkflow } from '@/modules/committees';
import type { CommitteeWorkflowState, CommitteeWorkflowType } from '@/modules/committees';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CommitteeWorkflowPanelProps {
  committeeId: string;
}

const workflowStateLabels: Record<CommitteeWorkflowState, string> = {
  draft: 'مسودة',
  in_progress: 'قيد التنفيذ',
  review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const workflowTypeLabels: Record<CommitteeWorkflowType, string> = {
  meeting_approval: 'اعتماد اجتماع',
  decision_review: 'مراجعة قرار',
  document_approval: 'اعتماد مستند',
  member_onboarding: 'إضافة عضو',
  budget_approval: 'اعتماد ميزانية',
  custom: 'مخصص',
};

function getStateColor(state: CommitteeWorkflowState): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (state) {
    case 'completed':
    case 'approved':
      return 'secondary';
    case 'in_progress':
      return 'outline';
    case 'rejected':
    case 'cancelled':
      return 'destructive';
    case 'review':
      return 'secondary';
    default:
      return 'default';
  }
}

function getStateIcon(state: CommitteeWorkflowState) {
  switch (state) {
    case 'completed':
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'in_progress':
      return <Clock className="h-4 w-4" />;
    case 'rejected':
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    case 'review':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return null;
  }
}

export function CommitteeWorkflowPanel({ committeeId }: CommitteeWorkflowPanelProps) {
  const [stateFilter, setStateFilter] = useState<CommitteeWorkflowState | 'all'>('all');
  const { data: workflows, isLoading } = useWorkflows(committeeId);
  const startWorkflow = useStartWorkflow();
  const completeWorkflow = useCompleteWorkflow();

  const filteredWorkflows = workflows?.filter(
    (w) => stateFilter === 'all' || w.state === stateFilter
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سير العمل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>سير العمل</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={stateFilter}
            onValueChange={(value) => setStateFilter(value as CommitteeWorkflowState | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="review">قيد المراجعة</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة سير عمل
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredWorkflows || filteredWorkflows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد سير عمل {stateFilter !== 'all' && `بحالة "${workflowStateLabels[stateFilter]}"`}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="border-l-4" style={{
                borderLeftColor: workflow.state === 'completed' || workflow.state === 'approved' ? 'hsl(var(--primary))' :
                  workflow.state === 'rejected' || workflow.state === 'cancelled' ? 'hsl(var(--destructive))' :
                  workflow.state === 'review' ? 'hsl(var(--chart-2))' :
                  'hsl(var(--border))'
              }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{workflow.title}</h4>
                        <Badge variant={getStateColor(workflow.state)}>
                          {getStateIcon(workflow.state)}
                          <span className="mr-1">{workflowStateLabels[workflow.state]}</span>
                        </Badge>
                        {workflow.priority === 'high' || workflow.priority === 'urgent' ? (
                          <Badge variant="destructive" className="text-xs">
                            {workflow.priority === 'urgent' ? 'عاجل' : 'مهم'}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {workflowTypeLabels[workflow.workflow_type]}
                      </p>
                      {workflow.description && (
                        <p className="text-sm mb-2">{workflow.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {workflow.stages && (
                          <span>
                            المراحل: {workflow.stages.filter((s: any) => s.state === 'completed').length} / {workflow.stages.length}
                          </span>
                        )}
                        {workflow.created_at && (
                          <span>
                            أُنشئ {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true, locale: ar })}
                          </span>
                        )}
                        {workflow.due_date && (
                          <span>
                            الموعد النهائي: {new Date(workflow.due_date).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {workflow.state === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startWorkflow.mutate(workflow.id)}
                          disabled={startWorkflow.isPending}
                        >
                          <Play className="h-4 w-4 ml-1" />
                          بدء
                        </Button>
                      )}
                      {workflow.state === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => completeWorkflow.mutate(workflow.id)}
                          disabled={completeWorkflow.isPending}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          إكمال
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
