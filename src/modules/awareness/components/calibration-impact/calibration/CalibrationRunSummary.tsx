// Gate-J Part 4.4: Calibration Run Summary
// Summary cards for a specific calibration run

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Users, TrendingDown, TrendingUp, Target, Activity } from 'lucide-react';
import type { CalibrationRun } from '@/modules/awareness';

interface CalibrationRunSummaryProps {
  run: CalibrationRun;
}

export function CalibrationRunSummary({ run }: CalibrationRunSummaryProps) {
  const getStatusColor = (status?: string) => {
    if (status === 'good') return 'bg-green-500 hover:bg-green-600';
    if (status === 'needs_tuning') return 'bg-yellow-500 hover:bg-yellow-600';
    if (status === 'bad') return 'bg-red-500 hover:bg-red-600';
    return 'bg-secondary';
  };

  const getStatusLabel = (status?: string) => {
    if (status === 'good') return 'Good';
    if (status === 'needs_tuning') return 'Needs Tuning';
    if (status === 'bad') return 'Bad';
    return 'Unknown';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Sample Size */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sample Size
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {run.sampleSize?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Validation records processed
          </p>
        </CardContent>
      </Card>

      {/* Avg Gap */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Gap
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {run.avgValidationGap?.toFixed(2) || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {run.avgValidationGap && run.avgValidationGap <= 10 ? '✅ High Accuracy' : '⚠️ Needs Improvement'}
          </p>
        </CardContent>
      </Card>

      {/* Max Gap */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Maximum Gap
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {run.maxValidationGap?.toFixed(2) || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Largest gap recorded
          </p>
        </CardContent>
      </Card>

      {/* Correlation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Correlation Score
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {run.correlationScore ? `${run.correlationScore.toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {run.correlationScore && run.correlationScore >= 75 ? '✅ Strong' : '⚠️ Medium'}
          </p>
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Overall Status
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge className={getStatusColor(run.overallStatus)}>
            {getStatusLabel(run.overallStatus)}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Calibration quality assessment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}