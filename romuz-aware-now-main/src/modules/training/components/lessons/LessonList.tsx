import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { LessonCard } from './LessonCard';
import { LessonForm } from './LessonForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import type { Lesson, CreateLessonInput } from '../../types';
import { useCreateLesson, useUpdateLesson, useDeleteLesson } from '../../hooks/useLessons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';

interface LessonListProps {
  moduleId: string;
  courseId: string;
  lessons: Lesson[];
}

export function LessonList({ moduleId, courseId, lessons }: LessonListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();
  const deleteMutation = useDeleteLesson();

  const handleSubmit = async (data: any) => {
    if (editingLesson) {
      await updateMutation.mutateAsync({ 
        id: editingLesson.id, 
        input: data 
      });
    } else {
      await createMutation.mutateAsync({ 
        ...data, 
        module_id: moduleId,
        course_id: courseId 
      } as CreateLessonInput);
    }
    handleCloseForm();
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLesson(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">الدروس</h3>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة درس
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">لا توجد دروس. ابدأ بإضافة درس جديد.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={index + 1}
              onEdit={handleEdit}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'تعديل الدرس' : 'درس جديد'}
            </DialogTitle>
          </DialogHeader>
          <LessonForm
            lesson={editingLesson || undefined}
            position={lessons.length + 1}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.
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
  );
}
