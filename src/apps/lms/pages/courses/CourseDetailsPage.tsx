import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Edit, Trash2, Archive, Globe, Layers } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useCourseById, useDeleteCourse, usePublishCourse, useArchiveCourse } from '@/modules/training/hooks';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog';

const statusColors = {
  draft: 'bg-secondary',
  published: 'bg-primary',
  archived: 'bg-muted',
};

const levelLabels = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

export default function CourseDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: course, isLoading } = useCourseById(id);
  const deleteMutation = useDeleteCourse();
  const publishMutation = usePublishCourse();
  const archiveMutation = useArchiveCourse();

  const handleDelete = async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    navigate('/lms/courses');
  };

  const handlePublish = async () => {
    if (!id) return;
    await publishMutation.mutateAsync(id);
  };

  const handleArchive = async () => {
    if (!id) return;
    await archiveMutation.mutateAsync(id);
  };

  if (isLoading) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/lms/courses')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.name}</h1>
            <p className="text-muted-foreground mt-1">{course.code}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate(`/lms/courses/${id}/builder`)}
          >
            <Layers className="ml-2 h-4 w-4" />
            بناء المحتوى
          </Button>
          {course.status === 'draft' && (
            <Button variant="outline" onClick={handlePublish}>
              <Globe className="ml-2 h-4 w-4" />
              نشر
            </Button>
          )}
          {course.status === 'published' && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="ml-2 h-4 w-4" />
              أرشفة
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => navigate(`/lms/courses/${id}/edit`)}
          >
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>تفاصيل الدورة</CardTitle>
                <Badge className={statusColors[course.status]}>
                  {course.status === 'draft' ? 'مسودة' : 
                   course.status === 'published' ? 'منشور' : 'مؤرشف'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">الوصف</h3>
                <p className="text-muted-foreground">
                  {course.description || 'لا يوجد وصف'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">المستوى</p>
                  <p className="font-medium">{levelLabels[course.level]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المدة</p>
                  <p className="font-medium">{course.duration_hours} ساعة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {course.modules && course.modules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الوحدات التدريبية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.modules.map((module, index) => (
                    <div 
                      key={module.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{index + 1}. {module.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {module.estimated_minutes} دقيقة
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {course.thumbnail_url && (
            <Card>
              <CardContent className="p-0">
                <img 
                  src={course.thumbnail_url} 
                  alt={course.name}
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                <p className="text-sm">
                  {new Date(course.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">آخر تحديث</p>
                <p className="text-sm">
                  {new Date(course.updated_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
