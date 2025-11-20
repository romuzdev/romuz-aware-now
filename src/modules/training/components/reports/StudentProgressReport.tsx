import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Users, Award, CheckCircle, TrendingUp } from 'lucide-react';
import type { StudentProgressReport as StudentProgressReportType } from '../../integration';

interface StudentProgressReportProps {
  reports: StudentProgressReportType[];
}

export function StudentProgressReport({ reports }: StudentProgressReportProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الإنجاز</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.length > 0
                ? Math.round(
                    reports.reduce((sum, r) => sum + r.average_progress, 0) / reports.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات المكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.reduce((sum, r) => sum + r.completed_courses, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشهادات الممنوحة</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.reduce((sum, r) => sum + r.certificates_earned, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل تقدم الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.user_id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{report.user_name}</p>
                      <p className="text-sm text-muted-foreground">{report.user_email}</p>
                    </div>
                    <Badge variant={report.completed_courses > 0 ? 'default' : 'secondary'}>
                      {report.completed_courses} دورة مكتملة
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">إجمالي التسجيلات: </span>
                      <span className="font-medium">{report.total_enrollments}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">قيد التقدم: </span>
                      <span className="font-medium">{report.in_progress_courses}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الشهادات: </span>
                      <span className="font-medium">{report.certificates_earned}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>معدل التقدم</span>
                      <span className="font-medium">{Math.round(report.average_progress)}%</span>
                    </div>
                    <Progress value={report.average_progress} />
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
