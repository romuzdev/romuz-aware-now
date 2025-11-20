import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { ClipboardCheck, TrendingUp, Award, XCircle } from 'lucide-react';
import type { AssessmentReport as AssessmentReportType } from '../../integration';

interface AssessmentReportProps {
  reports: AssessmentReportType[];
}

export function AssessmentReport({ reports }: AssessmentReportProps) {
  const totals = reports.reduce(
    (acc, assessment) => ({
      attempts: acc.attempts + assessment.total_attempts,
      passed: acc.passed + assessment.passed_attempts,
      failed: acc.failed + assessment.failed_attempts,
    }),
    { attempts: 0, passed: 0, failed: 0 }
  );

  const overallPassRate = totals.attempts > 0 ? (totals.passed / totals.attempts) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاختبارات</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحاولات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.attempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المحاولات الناجحة</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totals.passed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallPassRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقارير الاختبارات التفصيلية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((assessment) => (
              <div key={assessment.assessment_id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{assessment.assessment_title}</h3>
                    <p className="text-sm text-muted-foreground">{assessment.course_name}</p>
                  </div>
                  <Badge variant={assessment.pass_rate >= 70 ? 'default' : 'destructive'}>
                    {assessment.pass_rate.toFixed(1)}% معدل النجاح
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">إجمالي المحاولات</p>
                    <p className="text-xl font-bold">{assessment.total_attempts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ناجح</p>
                    <p className="text-xl font-bold text-green-600 flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {assessment.passed_attempts}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">راسب</p>
                    <p className="text-xl font-bold text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      {assessment.failed_attempts}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">متوسط الدرجات</p>
                    <p className="text-xl font-bold">{assessment.average_score.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>معدل النجاح</span>
                    <span className="font-medium">{assessment.pass_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={assessment.pass_rate} />
                </div>

                <div className="pt-2 border-t grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">أعلى درجة: </span>
                    <span className="font-medium text-green-600">
                      {assessment.highest_score.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">أقل درجة: </span>
                    <span className="font-medium text-red-600">
                      {assessment.lowest_score.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {reports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات لعرضها
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
