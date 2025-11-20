/**
 * Instructor Courses Page
 * Manage courses as an instructor
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Book, Users, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { fetchCourses } from '@/integrations/supabase/lms/courses.integration';

export default function InstructorCoursesPage() {
  const navigate = useNavigate();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: fetchCourses,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const publishedCourses = courses?.filter(c => c.status === 'published') || [];
  const draftCourses = courses?.filter(c => c.status === 'draft') || [];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">دوراتي التدريبية</h1>
          <p className="text-muted-foreground">
            إدارة المحتوى التدريبي والطلاب
          </p>
        </div>
        <Button onClick={() => navigate('/lms/courses/new')}>
          <Plus className="h-4 w-4 ml-2" />
          دورة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">منشور</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCourses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الإكمال</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>
      </div>

      {/* Published Courses */}
      {publishedCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">الدورات المنشورة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedCourses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/admin/lms/courses/${course.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="default">منشور</Badge>
                    <Badge variant="outline">
                      {course.level === 'beginner' ? 'مبتدئ' : 
                       course.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>0 طالب</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>0 شهادة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Draft Courses */}
      {draftCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">المسودات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftCourses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:shadow-lg transition-shadow border-dashed"
                onClick={() => navigate(`/admin/lms/courses/${course.id}/edit`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">مسودة</Badge>
                    <Badge variant="outline">
                      {course.level === 'beginner' ? 'مبتدئ' : 
                       course.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || 'لا يوجد وصف'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/lms/courses/${course.id}/edit`);
                  }}>
                    إكمال الإعداد
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!courses || courses.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Book className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد دورات بعد</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإنشاء دورتك التدريبية الأولى
            </p>
            <Button onClick={() => navigate('/admin/lms/courses/new')}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء دورة جديدة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
