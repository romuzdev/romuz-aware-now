import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ModuleCard } from './ModuleCard';
import { ModuleForm } from './ModuleForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import type { CourseModule, CreateModuleInput } from '../../types';
import { useCreateModule, useUpdateModule, useDeleteModule } from '../../hooks/useModules';
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

interface ModuleListProps {
  courseId: string;
  modules: CourseModule[];
  onAddLesson?: (moduleId: string) => void;
}

export function ModuleList({ courseId, modules, onAddLesson }: ModuleListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const deleteMutation = useDeleteModule();

  const handleSubmit = async (data: any) => {
    if (editingModule) {
      await updateMutation.mutateAsync({ 
        id: editingModule.id, 
        input: data 
      });
    } else {
      await createMutation.mutateAsync({ 
        ...data, 
        course_id: courseId 
      } as CreateModuleInput);
    }
    handleCloseForm();
  };

  const handleEdit = (module: CourseModule) => {
    setEditingModule(module);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingModule(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">الوحدات التدريبية</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة وحدة
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">لا توجد وحدات. ابدأ بإضافة وحدة جديدة.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onEdit={handleEdit}
              onDelete={(id) => setDeletingId(id)}
              onAddLesson={onAddLesson}
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'تعديل الوحدة' : 'وحدة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <ModuleForm
            module={editingModule || undefined}
            position={modules.length + 1}
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
              هل أنت متأكد من حذف هذه الوحدة؟ سيتم حذف جميع الدروس المرتبطة بها.
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
