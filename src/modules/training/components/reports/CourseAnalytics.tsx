import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import type { CourseAnalytics as CourseAnalyticsType } from '../../integration';

interface CourseAnalyticsProps {
  analytics: CourseAnalyticsType[];
}

export function CourseAnalytics({ analytics }: CourseAnalyticsProps) {
  const totals = analytics.reduce(
    (acc, course) => ({
      enrollments: acc.enrollments + course.total_enrollments,
      completed: acc.completed + course.completed_enrollments,
      certificates: acc.certificates + course.certificates_issued,
    }),
    { enrollments: 0, completed: 0, certificates: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.enrollments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات المكتملة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشهادات الصادرة</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.certificates}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تحليلات الدورات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.map((course) => (
              <div key={course.course_id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{course.course_name}</h3>
                    <p className="text-sm text-muted-foreground">{course.course_code}</p>
                  </div>
                  <Badge>
                    {course.completion_rate.toFixed(1)}% معدل الإكمال
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">إجمالي التسجيلات</p>
                    <p className="text-xl font-bold">{course.total_enrollments}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">نشط</p>
                    <p className="text-xl font-bold text-primary">{course.active_enrollments}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">مكتمل</p>
                    <p className="text-xl font-bold text-green-600">{course.completed_enrollments}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الشهادات</p>
                    <p className="text-xl font-bold">{course.certificates_issued}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>معدل التقدم</span>
                    <span className="font-medium">{course.average_progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={course.average_progress} />
                </div>

                {course.total_assessments > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {course.total_assessments} اختبار
                      </span>
                      <span className="font-medium">
                        متوسط الدرجات: {course.average_assessment_score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {analytics.length === 0 && (
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
