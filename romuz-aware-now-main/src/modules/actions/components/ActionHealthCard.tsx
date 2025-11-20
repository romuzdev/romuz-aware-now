/**
 * Action Health Card Component
 * Displays action health metrics and risk factors
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import type { ActionHealthMetrics } from '../types/tracking.types';

interface ActionHealthCardProps {
  metrics: ActionHealthMetrics;
}

export function ActionHealthCard({ metrics }: ActionHealthCardProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { label: 'ممتاز', variant: 'default' as const };
    if (score >= 60) return { label: 'جيد', variant: 'secondary' as const };
    if (score >= 40) return { label: 'متوسط', variant: 'outline' as const };
    return { label: 'ضعيف', variant: 'destructive' as const };
  };

  const healthBadge = getHealthBadge(metrics.healthScore);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">صحة الإجراء</h3>
          <Badge variant={healthBadge.variant}>{healthBadge.label}</Badge>
        </div>

        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">درجة الصحة</span>
            <span className={`text-2xl font-bold ${getHealthColor(metrics.healthScore)}`}>
              {metrics.healthScore.toFixed(0)}%
            </span>
          </div>
          <Progress value={metrics.healthScore} className="h-2" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>التقدم</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.currentProgress}%
            </p>
          </div>

          {/* Milestones */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>المعالم</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.milestonesCompleted}/{metrics.milestonesTotal}
            </p>
          </div>

          {/* Days Remaining */}
          {metrics.daysRemaining !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>الأيام المتبقية</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {metrics.daysRemaining > 0 ? metrics.daysRemaining : 'متأخر'}
              </p>
            </div>
          )}

          {/* Velocity */}
          {metrics.velocityScore !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {metrics.velocityScore > 1 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span>السرعة</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {metrics.velocityScore.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Status Flags */}
        <div className="flex items-center gap-2 flex-wrap">
          {metrics.isOnTrack && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              على المسار الصحيح
            </Badge>
          )}
          {metrics.isAtRisk && (
            <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              في خطر
            </Badge>
          )}
          {metrics.isOverdue && (
            <Badge variant="destructive" className="gap-1">
              <Clock className="h-3 w-3" />
              متأخر
            </Badge>
          )}
          {metrics.blockersCount > 0 && (
            <Badge variant="outline" className="gap-1">
              {metrics.blockersCount} عائق
            </Badge>
          )}
        </div>

        {/* Risk Factors */}
        {metrics.riskFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">عوامل الخطر</h4>
            <div className="space-y-2">
              {metrics.riskFactors.map((risk, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                >
                  {getSeverityIcon(risk.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {risk.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Completion */}
        {metrics.estimatedCompletionDate && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">تاريخ الإكمال المتوقع</span>
              <span className="font-medium text-foreground">
                {new Date(metrics.estimatedCompletionDate).toLocaleDateString('ar-SA')}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
