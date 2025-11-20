import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { useCourseById, useModulesByCourse } from '@/apps/lms/hooks';
import { ModuleList } from '@/apps/lms/components/modules';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function CourseBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { data: course, isLoading: courseLoading } = useCourseById(id);
  const { data: modules, isLoading: modulesLoading } = useModulesByCourse(id);

  if (courseLoading || modulesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">الدورة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(`/lms/courses/${id}`)}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">بناء محتوى الدورة</h1>
          <p className="text-muted-foreground mt-1">{course.title}</p>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">المحتوى</TabsTrigger>
          <TabsTrigger value="resources">المصادر</TabsTrigger>
          <TabsTrigger value="assessments">الاختبارات</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>محتوى الدورة</CardTitle>
            </CardHeader>
            <CardContent>
              <ModuleList 
                courseId={id!} 
                modules={modules || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                إدارة المصادر - قريباً
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                إدارة الاختبارات - قريباً
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
