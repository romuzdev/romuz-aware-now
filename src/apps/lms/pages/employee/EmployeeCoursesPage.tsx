import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { BookOpen, Clock, Award, Play } from 'lucide-react';
import { useMyEnrollments } from '@/modules/training/hooks/useEnrollments';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function EmployeeCoursesPage() {
  const navigate = useNavigate();
  const { data: enrollments, isLoading } = useMyEnrollments();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const activeEnrollments = enrollments?.filter((e) => e.status === 'active') || [];
  const completedEnrollments = enrollments?.filter((e) => e.status === 'completed') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">دوراتي التدريبية</h1>
        <p className="text-muted-foreground mt-2">
          تابع تقدمك في الدورات المسجل فيها
        </p>
      </div>

      {/* Active Courses */}
      {activeEnrollments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">الدورات النشطة</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">
                    {enrollment.course?.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {enrollment.course?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>التقدم</span>
                      <span>{enrollment.progress_percentage || 0}%</span>
                    </div>
                    <Progress value={enrollment.progress_percentage || 0} />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>التقدم: {enrollment.progress_percentage || 0}%</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => navigate(`/employee/courses/${enrollment.course_id}/play`)}
                  >
                    <Play className="ml-2 h-4 w-4" />
                    متابعة التعلم
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedEnrollments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">الدورات المكتملة</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="border-success">
                <CardHeader>
                  <CardTitle className="line-clamp-2">
                    {enrollment.course?.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {enrollment.course?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>التقدم</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>مكتمل</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/employee/courses/${enrollment.course_id}/play`)}
                  >
                    مراجعة الدورة
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeEnrollments.length === 0 && completedEnrollments.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">لم تسجل في أي دورة بعد</h3>
            <p className="text-muted-foreground">
              استكشف الدورات المتاحة وابدأ رحلتك التعليمية
            </p>
            <Button onClick={() => navigate('/employee/courses')}>
              تصفح الدورات
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
