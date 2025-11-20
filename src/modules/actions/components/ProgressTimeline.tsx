/**
 * Progress Timeline Component
 * Displays action progress over time
 */

import { Card } from '@/core/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ActionTrackingSnapshot } from '../types/tracking.types';

interface ProgressTimelineProps {
  snapshots: ActionTrackingSnapshot[];
}

export function ProgressTimeline({ snapshots }: ProgressTimelineProps) {
  const sortedSnapshots = [...snapshots].sort(
    (a, b) =>
      new Date(a.snapshot_at).getTime() - new Date(b.snapshot_at).getTime()
  );

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getHealthColor = (score: number | null) => {
    if (!score) return 'bg-gray-400';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (sortedSnapshots.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">لا توجد بيانات تتبع متاحة</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        الخط الزمني للتقدم
      </h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {sortedSnapshots.map((snapshot, index) => {
            const previousSnapshot = index > 0 ? sortedSnapshots[index - 1] : null;
            const progressChange = previousSnapshot
              ? snapshot.progress_pct - previousSnapshot.progress_pct
              : 0;

            return (
              <div key={snapshot.id} className="relative flex gap-4">
                {/* Timeline Dot */}
                <div
                  className={`relative z-10 h-8 w-8 rounded-full ${getHealthColor(
                    snapshot.health_score
                  )} flex items-center justify-center`}
                >
                  <span className="text-xs font-bold text-white">
                    {snapshot.progress_pct}%
                  </span>
                </div>

                {/* Content */}
                <Card className="flex-1 p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {new Date(snapshot.snapshot_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      {previousSnapshot && (
                        <div className="flex items-center gap-2">
                          {getTrendIcon(
                            snapshot.progress_pct,
                            previousSnapshot.progress_pct
                          )}
                          <span
                            className={`text-sm font-medium ${
                              progressChange > 0
                                ? 'text-green-600'
                                : progressChange < 0
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {progressChange > 0 ? '+' : ''}
                            {progressChange}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">التقدم</span>
                        <span className="font-medium text-foreground">
                          {snapshot.progress_pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">المعالم</span>
                        <span className="font-medium text-foreground">
                          {snapshot.milestones_completed}/{snapshot.milestones_total}
                        </span>
                      </div>
                      {snapshot.health_score !== null && (
                        <div>
                          <span className="text-muted-foreground block">الصحة</span>
                          <span className="font-medium text-foreground">
                            {snapshot.health_score.toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {snapshot.velocity_score !== null && (
                        <div>
                          <span className="text-muted-foreground block">السرعة</span>
                          <span className="font-medium text-foreground">
                            {snapshot.velocity_score.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {snapshot.is_on_track && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          على المسار
                        </span>
                      )}
                      {snapshot.is_at_risk && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                          في خطر
                        </span>
                      )}
                      {snapshot.is_overdue && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                          متأخر
                        </span>
                      )}
                      {snapshot.blockers_count > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {snapshot.blockers_count} عائق
                        </span>
                      )}
                    </div>

                    {/* Days Info */}
                    {(snapshot.days_elapsed !== null ||
                      snapshot.days_remaining !== null) && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        {snapshot.days_elapsed !== null && (
                          <span>مضى: {snapshot.days_elapsed} يوم</span>
                        )}
                        {snapshot.days_remaining !== null && (
                          <span>
                            متبقي:{' '}
                            {snapshot.days_remaining > 0
                              ? `${snapshot.days_remaining} يوم`
                              : 'متأخر'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
