/**
 * D4 Enhancement: Committee Analytics Dashboard
 * Display committee performance metrics and trends
 */

import { TrendingUp, TrendingDown, Minus, Users, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Progress } from '@/core/components/ui/progress';
import { useCommitteePerformance, useCommitteeAnalyticsTrends } from '@/modules/committees';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CommitteeAnalyticsDashboardProps {
  committeeId: string;
}

function getEfficiencyGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'ممتاز', color: 'hsl(var(--success))' };
  if (score >= 75) return { grade: 'جيد جداً', color: 'hsl(var(--primary))' };
  if (score >= 60) return { grade: 'جيد', color: 'hsl(var(--warning))' };
  if (score >= 50) return { grade: 'مقبول', color: 'hsl(var(--warning))' };
  return { grade: 'ضعيف', color: 'hsl(var(--destructive))' };
}

export function CommitteeAnalyticsDashboard({ committeeId }: CommitteeAnalyticsDashboardProps) {
  const { data: performance, isLoading: performanceLoading } = useCommitteePerformance(committeeId);
  const { data: trends, isLoading: trendsLoading } = useCommitteeAnalyticsTrends(committeeId, 30);

  if (performanceLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          لا توجد بيانات تحليلية متاحة
        </CardContent>
      </Card>
    );
  }

  const efficiencyGrade = getEfficiencyGrade(performance.efficiency_score || 0);

  // Prepare chart data
  const chartData = trends?.map((t) => ({
    date: new Date(t.snapshot_date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
    meetings: t.total_meetings,
    decisions: t.total_decisions,
    followups: t.completed_followups,
    efficiency: t.efficiency_score,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">عدد الاجتماعات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.total_meetings || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {performance.completed_meetings || 0} مكتمل
            </div>
            <Progress
              value={
                performance.total_meetings
                  ? ((performance.completed_meetings || 0) / performance.total_meetings) * 100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Total Decisions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">القرارات المتخذة</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.total_decisions || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              معدل: {performance.total_meetings ? (performance.total_decisions / performance.total_meetings).toFixed(1) : 0} قرار/اجتماع
            </div>
          </CardContent>
        </Card>

        {/* Followup Completion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">معدل إكمال المهام</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.total_followups
                ? Math.round(((performance.completed_followups || 0) / performance.total_followups) * 100)
                : 0}
              %
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {performance.completed_followups || 0} من {performance.total_followups || 0}
            </div>
            <Progress
              value={
                performance.total_followups
                  ? ((performance.completed_followups || 0) / performance.total_followups) * 100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Efficiency Score */}
        <Card className="border-2" style={{ borderColor: efficiencyGrade.color }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">كفاءة اللجنة</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: efficiencyGrade.color }}>
              {Math.round(performance.efficiency_score || 0)}%
            </div>
            <Badge
              className="mt-2"
              style={{
                backgroundColor: efficiencyGrade.color,
                color: 'white',
              }}
            >
              {efficiencyGrade.grade}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      {!trendsLoading && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>اتجاهات الأداء (آخر 30 يوم)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="meetings"
                  stroke="hsl(var(--primary))"
                  name="الاجتماعات"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="decisions"
                  stroke="hsl(var(--success))"
                  name="القرارات"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="followups"
                  stroke="hsl(var(--warning))"
                  name="المهام المكتملة"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معدل حضور الاجتماعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.avg_attendance_rate ? `${Math.round(performance.avg_attendance_rate)}%` : 'غير متوفر'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">متوسط مدة الاجتماع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.avg_meeting_duration_minutes
                ? `${performance.avg_meeting_duration_minutes} دقيقة`
                : 'غير متوفر'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">متوسط إنجاز المهام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.avg_completion_days
                ? `${Math.round(performance.avg_completion_days)} يوم`
                : 'غير متوفر'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
