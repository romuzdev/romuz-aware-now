import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { CourseModule, Lesson } from '../../types';

interface CourseProgressProps {
  modules: CourseModule[];
  completedLessons: Set<string>;
  currentLessonId?: string;
  onLessonSelect: (lessonId: string) => void;
}

export function CourseProgress({
  modules,
  completedLessons,
  currentLessonId,
  onLessonSelect,
}: CourseProgressProps) {
  const totalLessons = modules.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0);
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>التقدم في الدورة</CardTitle>
        <div className="space-y-2">
          <Progress value={progressPercentage} />
          <p className="text-sm text-muted-foreground">
            {completedCount} من {totalLessons} دروس ({Math.round(progressPercentage)}%)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module.id} className="space-y-2">
              <h4 className="font-medium text-sm">{module.name}</h4>
              <div className="space-y-1">
                {module.lessons?.map((lesson) => {
                  const isCompleted = completedLessons.has(lesson.id);
                  const isCurrent = currentLessonId === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onLessonSelect(lesson.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span className="flex-1 text-right">{lesson.name}</span>
                      {lesson.estimated_minutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{lesson.estimated_minutes} دقيقة</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
