// Gate-J Part 4.4: Calibration Stats Cards
// Overview cards showing aggregate calibration metrics

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { CheckCircle2, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import type { CalibrationRun } from '@/modules/awareness';

interface CalibrationStatsCardsProps {
  runs: CalibrationRun[];
}

export function CalibrationStatsCards({ runs }: CalibrationStatsCardsProps) {
  // Calculate aggregate stats
  const totalValidations = runs.reduce((sum, run) => sum + (run.sampleSize || 0), 0);
  const avgGap = runs.length > 0
    ? runs.reduce((sum, run) => sum + (run.avgValidationGap || 0), 0) / runs.length
    : 0;
  const avgCorrelation = runs.length > 0
    ? runs.reduce((sum, run) => sum + (run.correlationScore || 0), 0) / runs.length
    : 0;

  const statusCounts = runs.reduce((acc, run) => {
    const status = run.overallStatus || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = () => {
    const goodCount = statusCounts.good || 0;
    const badCount = statusCounts.bad || 0;
    
    if (goodCount > badCount) return 'text-green-500';
    if (badCount > goodCount) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getStatusLabel = () => {
    const goodCount = statusCounts.good || 0;
    const totalRuns = runs.length;
    
    if (goodCount / totalRuns >= 0.7) return 'Excellent';
    if (goodCount / totalRuns >= 0.4) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Validations Processed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Validations Processed
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalValidations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Across {runs.length} calibration runs
          </p>
        </CardContent>
      </Card>

      {/* Average Gap */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Gap
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgGap.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {avgGap <= 10 ? 'High Accuracy' : avgGap <= 20 ? 'Medium Accuracy' : 'Needs Improvement'}
          </p>
        </CardContent>
      </Card>

      {/* Correlation Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Correlation Score
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgCorrelation.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {avgCorrelation >= 75 ? 'Strong Correlation' : avgCorrelation >= 60 ? 'Medium Correlation' : 'Weak Correlation'}
          </p>
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Overall Status
          </CardTitle>
          <AlertTriangle className={`h-4 w-4 ${getStatusColor()}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {getStatusLabel()}
          </div>
          <div className="flex gap-2 mt-2">
            {statusCounts.good > 0 && (
              <Badge variant="outline" className="text-green-500 border-green-500">
                Good: {statusCounts.good}
              </Badge>
            )}
            {statusCounts.needs_tuning > 0 && (
              <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                Tuning: {statusCounts.needs_tuning}
              </Badge>
            )}
            {statusCounts.bad > 0 && (
              <Badge variant="outline" className="text-red-500 border-red-500">
                Bad: {statusCounts.bad}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}