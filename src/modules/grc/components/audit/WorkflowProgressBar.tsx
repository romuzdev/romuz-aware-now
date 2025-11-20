/**
 * Workflow Progress Bar Component
 * M12: Visual progress indicator for workflow stages
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { CheckCircle2, Circle, PlayCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowProgressBarProps {
  stages: {
    name: string;
    label: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    completedAt?: string;
  }[];
  currentStageIndex: number;
  overallProgress: number;
  workflowType: string;
  workflowStatus: string;
  showDetails?: boolean;
}

const STATUS_ICONS = {
  pending: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
  blocked: Circle,
};

const STATUS_COLORS = {
  pending: 'text-muted-foreground',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  blocked: 'text-red-500',
};

export function WorkflowProgressBar({
  stages,
  currentStageIndex,
  overallProgress,
  workflowType,
  workflowStatus,
  showDetails = true,
}: WorkflowProgressBarProps) {
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'في الانتظار',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      blocked: 'محظور',
      cancelled: 'ملغى',
    };
    return labels[status] || status;
  };

  const getWorkflowTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      planning: 'التخطيط',
      execution: 'التنفيذ',
      reporting: 'إعداد التقارير',
      followup: 'المتابعة',
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              تقدم سير العمل: {getWorkflowTypeLabel(workflowType)}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{completedCount} من {totalStages} مراحل مكتملة</span>
            </div>
          </div>
          <Badge variant={workflowStatus === 'completed' ? 'default' : 'secondary'}>
            {getStatusLabel(workflowStatus)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">التقدم الإجمالي</span>
            <span className="text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Stage Timeline */}
        {showDetails && (
          <div className="relative space-y-4">
            {stages.map((stage, index) => {
              const StatusIcon = STATUS_ICONS[stage.status];
              const isLast = index === stages.length - 1;
              const isCurrent = index === currentStageIndex;

              return (
                <div key={stage.name} className="relative flex items-center gap-4">
                  {/* Connector Line */}
                  {!isLast && (
                    <div 
                      className={cn(
                        "absolute right-[18px] top-8 w-0.5 h-8",
                        stage.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                      )}
                    />
                  )}

                  {/* Status Icon */}
                  <div 
                    className={cn(
                      "relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all",
                      stage.status === 'completed' && 'bg-green-500 border-green-500',
                      stage.status === 'in_progress' && 'bg-blue-500 border-blue-500 animate-pulse',
                      stage.status === 'pending' && 'bg-background border-muted',
                      stage.status === 'blocked' && 'bg-red-500 border-red-500',
                      isCurrent && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    <StatusIcon 
                      className={cn(
                        "w-5 h-5",
                        stage.status === 'completed' && 'text-white',
                        stage.status === 'in_progress' && 'text-white',
                        stage.status === 'pending' && STATUS_COLORS[stage.status],
                        stage.status === 'blocked' && 'text-white'
                      )}
                    />
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          isCurrent && "text-primary"
                        )}>
                          {stage.label}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {stage.name}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge variant="outline" className="shrink-0">
                          المرحلة الحالية
                        </Badge>
                      )}
                    </div>
                    {stage.completedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        مكتمل في {new Date(stage.completedAt).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-muted-foreground">مكتمل</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stages.filter(s => s.status === 'in_progress').length}
            </p>
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">
              {stages.filter(s => s.status === 'pending').length}
            </p>
            <p className="text-xs text-muted-foreground">في الانتظار</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
