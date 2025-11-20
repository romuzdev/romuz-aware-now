import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { Lesson } from '../../types';

interface LessonViewerProps {
  lesson: Lesson;
  enrollmentId: string;
  isCompleted?: boolean;
  onComplete: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function LessonViewer({
  lesson,
  enrollmentId,
  isCompleted = false,
  onComplete,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}: LessonViewerProps) {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const handleComplete = () => {
    setIsTracking(false);
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle>{lesson.name}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>الوقت المقدر: {lesson.estimated_minutes || 0} دقيقة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>الوقت المستغرق: {formatTime(timeSpent)}</span>
                </div>
              </div>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 text-success">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">مكتمل</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Display */}
          <div className="prose prose-sm max-w-none">
            {lesson.content_type === 'video' && lesson.content_url && (
              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                <video controls className="w-full h-full rounded-lg">
                  <source src={lesson.content_url} />
                  المتصفح لا يدعم تشغيل الفيديو
                </video>
              </div>
            )}
            {lesson.content_type === 'pdf' && lesson.content_url && (
              <div className="w-full h-[600px] border rounded-lg">
                <iframe
                  src={lesson.content_url}
                  className="w-full h-full rounded-lg"
                  title={lesson.name}
                />
              </div>
            )}
            {lesson.content_type === 'text' && lesson.content && (
              <div className="whitespace-pre-wrap">{lesson.content}</div>
            )}
            {lesson.content_type === 'interactive' && lesson.content_url && (
              <div className="w-full h-[600px] border rounded-lg">
                <iframe
                  src={lesson.content_url}
                  className="w-full h-full rounded-lg"
                  title={lesson.name}
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!hasPrevious}
            >
              <ChevronRight className="ml-2 h-4 w-4" />
              الدرس السابق
            </Button>

            {!isCompleted && (
              <Button onClick={handleComplete}>
                <Check className="ml-2 h-4 w-4" />
                إكمال الدرس
              </Button>
            )}

            <Button
              onClick={onNext}
              disabled={!hasNext}
            >
              الدرس التالي
              <ChevronLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
