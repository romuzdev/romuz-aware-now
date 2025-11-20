import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { CourseForm } from '@/apps/lms/components/courses';
import { useCourseById, useCreateCourse, useUpdateCourse } from '@/apps/lms/hooks';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function CourseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: course, isLoading } = useCourseById(id);
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const handleSubmit = async (data: any) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, input: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    navigate('/lms/courses');
  };

  if (isEdit && isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/lms/courses')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'تعديل الدورة' : 'دورة جديدة'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'تحديث بيانات الدورة التدريبية' : 'إنشاء دورة تدريبية جديدة'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات الدورة</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm 
            course={course || undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
