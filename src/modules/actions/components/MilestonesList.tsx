/**
 * Milestones List Component
 * Displays and manages action milestones
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus } from 'lucide-react';
import type { ActionMilestone } from '../types/milestones.types';

interface MilestonesListProps {
  milestones: ActionMilestone[];
  onEdit?: (milestone: ActionMilestone) => void;
  onComplete?: (milestoneId: string) => void;
  onAdd?: () => void;
  readOnly?: boolean;
}

export function MilestonesList({
  milestones,
  onEdit,
  onComplete,
  onAdd,
  readOnly = false,
}: MilestonesListProps) {
  const sortedMilestones = [...milestones].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'معلّق',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      delayed: 'متأخر',
      cancelled: 'ملغى',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      start: 'بداية',
      checkpoint: 'نقطة فحص',
      deliverable: 'مخرج',
      review: 'مراجعة',
      completion: 'اكتمال',
    };
    return labels[type] || type;
  };

  const isOverdue = (milestone: ActionMilestone) => {
    if (milestone.status === 'completed') return false;
    const today = new Date();
    const plannedDate = new Date(milestone.planned_date);
    return plannedDate < today;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          المعالم ({milestones.length})
        </h3>
        {!readOnly && onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة معلم
          </Button>
        )}
      </div>

      {sortedMilestones.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">لا توجد معالم محددة</p>
          {!readOnly && onAdd && (
            <Button onClick={onAdd} variant="outline" className="mt-4">
              إضافة أول معلم
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedMilestones.map((milestone) => (
            <Card
              key={milestone.id}
              className={`p-4 ${
                isOverdue(milestone) ? 'border-orange-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">{getStatusIcon(milestone.status)}</div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {milestone.title_ar}
                      </h4>
                      {milestone.description_ar && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description_ar}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getTypeLabel(milestone.milestone_type)}
                      </Badge>
                      <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                        {getStatusLabel(milestone.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">التاريخ المخطط:</span>
                      <span className="font-medium">
                        {new Date(milestone.planned_date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    {milestone.actual_date && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">التاريخ الفعلي:</span>
                        <span className="font-medium">
                          {new Date(milestone.actual_date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                    {isOverdue(milestone) && (
                      <Badge variant="destructive">متأخر</Badge>
                    )}
                  </div>

                  {milestone.status !== 'completed' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">نسبة الإنجاز</span>
                        <span className="font-medium">{milestone.completion_pct}%</span>
                      </div>
                      <Progress value={milestone.completion_pct} />
                    </div>
                  )}

                  {!readOnly && (
                    <div className="flex items-center gap-2 pt-2">
                      {onEdit && (
                        <Button
                          onClick={() => onEdit(milestone)}
                          variant="outline"
                          size="sm"
                        >
                          تعديل
                        </Button>
                      )}
                      {onComplete && milestone.status !== 'completed' && (
                        <Button
                          onClick={() => onComplete(milestone.id)}
                          size="sm"
                        >
                          تعليم كمكتمل
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
