/**
 * Workflow Stage Card Component
 * M12: Visual card for displaying individual workflow stage status
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { CheckCircle2, Circle, Clock, PlayCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface WorkflowStageCardProps {
  stageName: string;
  stageLabel: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  isCurrentStage?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onView?: () => void;
}

const STATUS_CONFIG = {
  pending: {
    icon: Circle,
    label: 'في الانتظار',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    variant: 'secondary' as const,
  },
  in_progress: {
    icon: PlayCircle,
    label: 'قيد التنفيذ',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    variant: 'default' as const,
  },
  completed: {
    icon: CheckCircle2,
    label: 'مكتمل',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    variant: 'default' as const,
  },
  blocked: {
    icon: AlertCircle,
    label: 'محظور',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    variant: 'destructive' as const,
  },
};

export function WorkflowStageCard({
  stageName,
  stageLabel,
  status,
  description,
  assignedTo,
  dueDate,
  completedAt,
  notes,
  isCurrentStage = false,
  onStart,
  onComplete,
  onView,
}: WorkflowStageCardProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <Card 
      className={cn(
        "relative transition-all hover:shadow-md",
        isCurrentStage && "ring-2 ring-primary"
      )}
    >
      {isCurrentStage && (
        <div className="absolute -top-3 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
          المرحلة الحالية
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("p-2 rounded-lg mt-0.5", config.bgColor)}>
              <StatusIcon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-1">{stageLabel}</CardTitle>
              <CardDescription className="text-sm">{stageName}</CardDescription>
            </div>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <div className="space-y-2">
          {assignedTo && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المسؤول:</span>
              <span className="font-medium">{assignedTo}</span>
            </div>
          )}

          {dueDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(dueDate), 'dd MMMM yyyy', { locale: ar })}
              </span>
            </div>
          )}

          {completedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">تاريخ الإكمال:</span>
              <span className="font-medium text-green-600">
                {format(new Date(completedAt), 'dd MMMM yyyy', { locale: ar })}
              </span>
            </div>
          )}
        </div>

        {notes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">{notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {status === 'pending' && onStart && (
            <Button onClick={onStart} size="sm" className="flex-1">
              <PlayCircle className="w-4 h-4 ml-2" />
              بدء المرحلة
            </Button>
          )}

          {status === 'in_progress' && onComplete && (
            <Button onClick={onComplete} size="sm" className="flex-1">
              <CheckCircle2 className="w-4 h-4 ml-2" />
              إكمال المرحلة
            </Button>
          )}

          {onView && (
            <Button onClick={onView} variant="outline" size="sm" className="flex-1">
              عرض التفاصيل
              <ChevronRight className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
