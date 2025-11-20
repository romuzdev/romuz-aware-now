/**
 * Student My Courses Page
 * Displays enrolled courses for the current student
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Book, Clock, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { fetchUserEnrollments } from '@/integrations/supabase/lms/enrollments.integration';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: () => fetchUserEnrollments(user?.id || ''),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const activeEnrollments = enrollments?.filter(e => e.status === 'active') || [];
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed') || [];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">دوراتي التدريبية</h1>
        <p className="text-muted-foreground">
          تابع تقدمك في الدورات المسجل بها
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات النشطة</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات المكتملة</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEnrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التقدم</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeEnrollments.length > 0
                ? Math.round(
                    activeEnrollments.reduce((sum, e) => sum + e.progress_percent, 0) /
                      activeEnrollments.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الساعات</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Courses */}
      {activeEnrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">الدورات الجارية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEnrollments.map((enrollment) => (
              <Card
                key={enrollment.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/student/courses/${enrollment.course_id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">نشط</Badge>
                    {enrollment.score && (
                      <div className="text-sm font-medium">
                        {enrollment.score}%
                      </div>
                    )}
                  </div>
                  <CardTitle className="mt-4">دورة تدريبية</CardTitle>
                  <CardDescription>التقدم: {enrollment.progress_percent}%</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={enrollment.progress_percent} className="mb-2" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>تاريخ التسجيل: {new Date(enrollment.enrolled_at).toLocaleDateString('ar')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedEnrollments.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">الدورات المكتملة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedEnrollments.map((enrollment) => (
              <Card
                key={enrollment.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/student/courses/${enrollment.course_id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="default" className="bg-green-500">
                      <Award className="h-3 w-3 mr-1" />
                      مكتمل
                    </Badge>
                    {enrollment.score && (
                      <div className="text-sm font-medium">
                        النتيجة: {enrollment.score}%
                      </div>
                    )}
                  </div>
                  <CardTitle className="mt-4">دورة تدريبية</CardTitle>
                  <CardDescription>
                    أكملت في: {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString('ar') : '-'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enrollment.certificate_id && (
                    <Badge variant="outline" className="w-full justify-center">
                      <Award className="h-3 w-3 ml-1" />
                      شهادة متاحة
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!enrollments || enrollments.length === 0 && (
        <div className="text-center py-12">
          <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد دورات مسجلة</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ رحلتك التعليمية بالتسجيل في دورة
          </p>
          <button
            onClick={() => navigate('/student/browse')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            تصفح الدورات
          </button>
        </div>
      )}
    </div>
  );
}
