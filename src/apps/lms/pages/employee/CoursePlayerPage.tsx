import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useCourseById } from '@/modules/training/hooks';
import { useModulesByCourse } from '@/modules/training/hooks/useModules';
import { useMyEnrollments, useUpdateProgress } from '@/modules/training/hooks/useEnrollments';
import { LessonViewer, CourseProgress } from '@/modules/training/components/student';
import { Skeleton } from '@/core/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function CoursePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const { data: course, isLoading: courseLoading } = useCourseById(id);
  const { data: modules, isLoading: modulesLoading } = useModulesByCourse(id);
  const { data: enrollments } = useMyEnrollments();
  const updateProgress = useUpdateProgress();

  const enrollment = enrollments?.find((e) => e.course_id === id);

  // Get all lessons in order
  const allLessons = modules?.flatMap((m) => m.lessons || []) || [];
  const currentLesson = allLessons.find((l) => l.id === currentLessonId);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);

  useEffect(() => {
    if (allLessons.length > 0 && !currentLessonId) {
      // Start with first incomplete lesson or first lesson
      const firstIncomplete = allLessons.find((l) => !completedLessons.has(l.id));
      setCurrentLessonId(firstIncomplete?.id || allLessons[0].id);
    }
  }, [allLessons, currentLessonId, completedLessons]);

  const handleCompleteLesson = async () => {
    if (!currentLessonId || !enrollment) return;

    try {
      await updateProgress.mutateAsync({
        enrollmentId: enrollment.id,
        lessonId: currentLessonId,
        status: 'completed',
      });

      setCompletedLessons((prev) => new Set([...prev, currentLessonId]));
      toast({ title: 'تم إكمال الدرس', description: 'أحسنت! تقدم للدرس التالي' });
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleNextLesson = () => {
    if (currentIndex < allLessons.length - 1) {
      setCurrentLessonId(allLessons[currentIndex + 1].id);
    }
  };

  const handlePreviousLesson = () => {
    if (currentIndex > 0) {
      setCurrentLessonId(allLessons[currentIndex - 1].id);
    }
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-3" />
        </div>
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
          onClick={() => navigate('/student/courses')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Course Progress */}
        <div className="lg:col-span-1">
          <CourseProgress
            modules={modules || []}
            completedLessons={completedLessons}
            currentLessonId={currentLessonId || undefined}
            onLessonSelect={setCurrentLessonId}
          />
        </div>

        {/* Main Content - Lesson Viewer */}
        <div className="lg:col-span-3">
          {currentLesson && enrollment ? (
            <LessonViewer
              lesson={currentLesson}
              enrollmentId={enrollment.id}
              isCompleted={completedLessons.has(currentLesson.id)}
              onComplete={handleCompleteLesson}
              onNext={handleNextLesson}
              onPrevious={handlePreviousLesson}
              hasNext={currentIndex < allLessons.length - 1}
              hasPrevious={currentIndex > 0}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              اختر درساً من القائمة للبدء
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
