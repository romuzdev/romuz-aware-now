import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import type { CourseModule } from '@/integrations/supabase/lms';
import { createModuleSchema, type ModuleCreateInput } from '@/modules/training/types/module.types.validation';

// Omit server-side fields for form usage
type ModuleFormData = Omit<ModuleCreateInput, 'course_id'>;

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  module?: CourseModule;
  onSubmit: (data: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function ModuleDialog({ open, onOpenChange, courseId, module, onSubmit }: ModuleDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(createModuleSchema.omit({ course_id: true })),
    defaultValues: module ? {
      name: module.title,
      description: module.description || '',
      position: module.position,
    } : {
      position: 0,
    },
  });

  const handleFormSubmit = async (data: ModuleFormData) => {
    await onSubmit({
      course_id: courseId,
      title: data.name,
      description: data.description || null,
      position: data.position,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">عنوان الوحدة *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="مقدمة في الأمن السيبراني"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="وصف الوحدة..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">الترتيب</Label>
            <Input
              id="position"
              type="number"
              {...register('position', { valueAsNumber: true })}
              placeholder="0"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
