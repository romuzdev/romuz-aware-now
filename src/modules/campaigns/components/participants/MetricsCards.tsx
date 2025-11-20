import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import type { ParticipantMetrics } from '@/modules/campaigns';

interface Props {
  metrics: ParticipantMetrics | undefined;
  loading: boolean;
}

export function MetricsCards({ metrics, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm">Loading...</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">—</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Participants</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.total}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Started</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.started}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.completed}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Score</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {metrics.avgScore !== null ? metrics.avgScore.toFixed(1) : '—'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.overdue}</CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Not Started</span>
              <span className="font-medium">{metrics.breakdown.not_started}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-medium">{metrics.breakdown.in_progress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">{metrics.breakdown.completed}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
