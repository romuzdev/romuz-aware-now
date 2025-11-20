/**
 * Student Course View Page
 * Displays course content and lessons for enrolled students
 */

import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, PlayCircle, FileText, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { fetchCourseById } from '@/integrations/supabase/lms/courses.integration';
import { fetchModulesByCourse } from '@/modules/training/integration/modules.integration';
import { fetchLessonsByModule } from '@/integrations/supabase/lms/lessons.integration';
import { checkEnrollment } from '@/integrations/supabase/lms/enrollments.integration';
import { fetchEnrollmentProgress } from '@/integrations/supabase/lms/progress.integration';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

export default function CourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseById(courseId!),
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', user?.id, courseId],
    queryFn: () => checkEnrollment(user?.id || '', courseId!),
    enabled: !!user?.id && !!courseId,
  });

  const { data: modules } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => fetchModulesByCourse(courseId!),
    enabled: !!courseId,
  });

  const { data: progress } = useQuery({
    queryKey: ['progress', enrollment?.id],
    queryFn: () => fetchEnrollmentProgress(enrollment?.id || ''),
    enabled: !!enrollment?.id,
  });

  if (courseLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 mb-6" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">الدورة غير موجودة</h2>
        <Button onClick={() => navigate(-1)}>العودة</Button>
      </div>
    );
  }

  const completedLessons = progress?.filter(p => p.status === 'completed').length || 0;
  const totalLessons = modules?.reduce((sum, m) => sum + (m.totalLessons || 0), 0) || 0;

  return (
    <div className="container mx-auto p-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowRight className="h-4 w-4 ml-2" />
        العودة
      </Button>

      {/* Course Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
              <CardDescription className="text-base">
                {course.description}
              </CardDescription>
            </div>
            <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
              {course.status === 'published' ? 'منشور' : course.status === 'draft' ? 'مسودة' : 'مؤرشف'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {enrollment && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">التقدم الإجمالي</span>
                  <span className="text-sm text-muted-foreground">
                    {completedLessons} / {totalLessons} دروس
                  </span>
                </div>
                <Progress value={enrollment.progress_percent} />
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">المستوى: </span>
                  <span className="font-medium">{course.level === 'beginner' ? 'مبتدئ' : course.level === 'intermediate' ? 'متوسط' : 'متقدم'}</span>
                </div>
                {course.estimated_duration_minutes && (
                  <div>
                    <span className="text-muted-foreground">المدة: </span>
                    <span className="font-medium">{Math.floor(course.estimated_duration_minutes / 60)} ساعة</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Content */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">المحتوى</TabsTrigger>
          <TabsTrigger value="assessments">الاختبارات</TabsTrigger>
          {enrollment?.certificate_id && (
            <TabsTrigger value="certificate">الشهادة</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {modules?.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              moduleNumber={index + 1}
              progress={progress}
              onLessonClick={(lessonId) => setSelectedLesson(lessonId)}
            />
          ))}

          {(!modules || modules.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا يوجد محتوى متاح بعد</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد اختبارات متاحة</p>
            </CardContent>
          </Card>
        </TabsContent>

        {enrollment?.certificate_id && (
          <TabsContent value="certificate">
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">تهانينا!</h3>
                <p className="text-muted-foreground mb-4">
                  لقد أكملت هذه الدورة بنجاح
                </p>
                <Button onClick={() => navigate(`/student/certificates/${enrollment.certificate_id}`)}>
                  عرض الشهادة
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface ModuleCardProps {
  module: any;
  moduleNumber: number;
  progress?: any[];
  onLessonClick: (lessonId: string) => void;
}

function ModuleCard({ module, moduleNumber, progress, onLessonClick }: ModuleCardProps) {
  const { data: lessons } = useQuery({
    queryKey: ['lessons', module.id],
    queryFn: () => fetchLessonsByModule(module.id),
  });

  const completedLessons = lessons?.filter(l => 
    progress?.some(p => p.lesson_id === l.id && p.status === 'completed')
  ).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary">الوحدة {moduleNumber}</span>
              <span>{module.name}</span>
            </CardTitle>
            {module.description && (
              <CardDescription className="mt-2">{module.description}</CardDescription>
            )}
          </div>
          <Badge variant="outline">
            {completedLessons} / {lessons?.length || 0}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lessons?.map((lesson, index) => {
            const lessonProgress = progress?.find(p => p.lesson_id === lesson.id);
            const isCompleted = lessonProgress?.status === 'completed';

            return (
              <button
                key={lesson.id}
                onClick={() => onLessonClick(lesson.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-right"
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <PlayCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {index + 1}. {lesson.title}
                  </div>
                  {lesson.duration_minutes > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {lesson.duration_minutes} دقيقة
                    </div>
                  )}
                </div>
                <Badge variant={lesson.content_type === 'video' ? 'default' : 'secondary'} className="text-xs">
                  {lesson.content_type === 'video' ? 'فيديو' : 
                   lesson.content_type === 'document' ? 'مستند' : 
                   lesson.content_type === 'quiz' ? 'اختبار' : 'محتوى'}
                </Badge>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
