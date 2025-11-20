import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Clock, Users } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useCourses } from '@/apps/lms/hooks';

export default function CoursesListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: courses, isLoading } = useCourses();

  const filteredCourses = courses?.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: courses?.length || 0,
    published: courses?.filter(c => c.status === 'published').length || 0,
    draft: courses?.filter(c => c.status === 'draft').length || 0,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الدورات التدريبية</h1>
          <p className="text-muted-foreground mt-2">
            إدارة جميع الدورات التدريبية في النظام
          </p>
        </div>
        <Button onClick={() => navigate('/lms/courses/new')}>
          <Plus className="ml-2 h-4 w-4" />
          دورة جديدة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات المنشورة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المسودات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الدورات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCourses?.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد دورات تدريبية بعد'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses?.map((course) => (
                <Card 
                  key={course.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/admin/lms/courses/${course.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {course.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.code}
                        </p>
                      </div>
                      <Badge 
                        variant={course.status === 'published' ? 'default' : 'secondary'}
                      >
                        {course.status === 'published' ? 'منشور' : 
                         course.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description || 'لا يوجد وصف'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {course.estimated_duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.estimated_duration_minutes} دقيقة</span>
                        </div>
                      )}
                      {course.level && (
                        <Badge variant="outline">
                          {course.level === 'beginner' ? 'مبتدئ' :
                           course.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
