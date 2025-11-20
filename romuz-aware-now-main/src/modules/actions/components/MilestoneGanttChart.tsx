/**
 * Milestone Gantt Chart Component
 * Displays milestones in a Gantt chart timeline view
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { ActionMilestone } from '../types/milestones.types';

interface MilestoneGanttChartProps {
  milestones: ActionMilestone[];
  startDate?: Date;
  endDate?: Date;
}

export function MilestoneGanttChart({
  milestones,
  startDate,
  endDate,
}: MilestoneGanttChartProps) {
  // Sort milestones by planned date
  const sortedMilestones = [...milestones].sort(
    (a, b) =>
      new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
  );

  // Calculate timeline boundaries
  const allDates = sortedMilestones.map((m) => new Date(m.planned_date));
  const timelineStart =
    startDate || (allDates.length > 0 ? allDates[0] : new Date());
  const timelineEnd =
    endDate ||
    (allDates.length > 0 ? allDates[allDates.length - 1] : new Date());

  const totalDays = Math.max(
    1,
    Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  );

  const getPositionPercentage = (date: Date) => {
    const daysSinceStart = Math.max(
      0,
      Math.ceil((date.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    );
    return Math.min(100, (daysSinceStart / totalDays) * 100);
  };

  const getStatusIcon = (milestone: ActionMilestone) => {
    switch (milestone.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'delayed':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (milestone: ActionMilestone) => {
    switch (milestone.status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-orange-500';
      case 'cancelled':
        return 'bg-gray-400';
      default:
        return 'bg-muted-foreground';
    }
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
    return new Date(milestone.planned_date) < new Date();
  };

  // Generate month markers
  const generateMonthMarkers = () => {
    const markers: { label: string; position: number }[] = [];
    const currentDate = new Date(timelineStart);
    
    while (currentDate <= timelineEnd) {
      const position = getPositionPercentage(currentDate);
      const label = currentDate.toLocaleDateString('ar-SA', {
        month: 'short',
        year: 'numeric',
      });
      markers.push({ label, position });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return markers;
  };

  const monthMarkers = generateMonthMarkers();

  if (sortedMilestones.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">لا توجد معالم لعرضها في الجدول الزمني</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            الجدول الزمني للمعالم
          </h3>
          <div className="text-sm text-muted-foreground">
            {timelineStart.toLocaleDateString('ar-SA')} - {timelineEnd.toLocaleDateString('ar-SA')}
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Month Markers */}
          <div className="relative h-8 border-b border-border mb-4">
            {monthMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 border-r border-border/50"
                style={{ right: `${100 - marker.position}%` }}
              >
                <span className="absolute top-1 right-0 translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                  {marker.label}
                </span>
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            {sortedMilestones.map((milestone, index) => {
              const position = getPositionPercentage(new Date(milestone.planned_date));
              
              return (
                <div key={milestone.id} className="relative">
                  {/* Milestone Row */}
                  <div className="flex items-center gap-4 py-2">
                    {/* Milestone Info */}
                    <div className="w-48 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(milestone)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {milestone.title_ar}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getTypeLabel(milestone.milestone_type)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Track */}
                    <div className="flex-1 relative h-12 bg-muted/30 rounded">
                      {/* Progress Bar */}
                      {milestone.status !== 'pending' && (
                        <div
                          className="absolute top-0 bottom-0 bg-primary/20 rounded"
                          style={{
                            right: `${100 - position}%`,
                            width: `${position}%`,
                          }}
                        />
                      )}

                      {/* Milestone Marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 z-10"
                        style={{ right: `${100 - position}%`, transform: 'translate(50%, -50%)' }}
                      >
                        <div className="relative group">
                          <div
                            className={`w-4 h-4 rounded-full border-2 border-background ${getStatusColor(
                              milestone
                            )} cursor-pointer hover:scale-125 transition-transform`}
                          />
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <div className="bg-popover text-popover-foreground rounded-lg shadow-lg p-3 min-w-[200px] border border-border">
                              <p className="font-medium mb-1">{milestone.title_ar}</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {new Date(milestone.planned_date).toLocaleDateString('ar-SA')}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(milestone.milestone_type)}
                                </Badge>
                                {isOverdue(milestone) && (
                                  <Badge variant="destructive" className="text-xs">
                                    متأخر
                                  </Badge>
                                )}
                              </div>
                              {milestone.status !== 'completed' && (
                                <div className="mt-2 text-xs">
                                  نسبة الإنجاز: {milestone.completion_pct}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Label */}
                      <div
                        className="absolute bottom-0 text-xs text-muted-foreground whitespace-nowrap"
                        style={{
                          right: `${100 - position}%`,
                          transform: 'translate(50%, 100%)',
                        }}
                      >
                        {new Date(milestone.planned_date).toLocaleDateString('ar-SA', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-16 text-left flex-shrink-0">
                      <span className="text-sm font-medium text-foreground">
                        {milestone.completion_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">مكتمل</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">قيد التنفيذ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">متأخر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">معلّق</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
