import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import type { Course } from '@/integrations/supabase/lms';
import { createCourseSchema } from '@/modules/training/types/course.types.validation';

// UI-friendly schema that maps to DB schema
const courseFormSchema = createCourseSchema.pick({
  code: true,
  name: true,
  description: true,
  level: true,
  status: true,
  estimated_duration_minutes: true,
});

type CourseFormData = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CourseFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CourseForm({ course, onSubmit, isLoading }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: course ? {
      code: course.code,
      name: course.title,
      description: course.description || '',
      level: course.level,
      status: course.status,
      estimated_duration_minutes: course.estimated_duration_minutes || undefined,
    } : {
      level: 'beginner',
      status: 'draft',
    },
  });

  const level = watch('level');
  const status = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">رمز الدورة *</Label>
          <Input
            id="code"
            {...register('code')}
            placeholder="COURSE-001"
            disabled={isLoading}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">عنوان الدورة *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="أساسيات الأمن السيبراني"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="وصف الدورة..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="level">المستوى *</Label>
          <Select
            value={level}
            onValueChange={(value) => setValue('level', value as any)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">مبتدئ</SelectItem>
              <SelectItem value="intermediate">متوسط</SelectItem>
              <SelectItem value="advanced">متقدم</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">الحالة *</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue('status', value as any)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="published">منشور</SelectItem>
              <SelectItem value="archived">مؤرشف</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimated_duration_minutes">المدة التقديرية (بالدقائق)</Label>
        <Input
          id="estimated_duration_minutes"
          type="number"
          {...register('estimated_duration_minutes', { valueAsNumber: true })}
          placeholder="60"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ الدورة'}
        </Button>
      </div>
    </form>
  );
}
