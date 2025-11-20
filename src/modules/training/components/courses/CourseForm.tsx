import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
import type { Course } from '../../types';

const courseSchema = z.object({
  code: z.string().min(2, 'يجب أن يكون الكود حرفين على الأقل').max(50),
  name: z.string().min(3, 'يجب أن يكون الاسم 3 أحرف على الأقل').max(255),
  description: z.string().optional(),
  category_id: z.string().uuid('يجب اختيار تصنيف'),
  instructor_id: z.string().uuid('يجب اختيار مدرب'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_hours: z.number().int().positive('يجب أن تكون المدة رقم موجب'),
  thumbnail_url: z.string().url('رابط غير صحيح').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CourseFormData) => void;
  isLoading?: boolean;
}

export function CourseForm({ course, onSubmit, isLoading }: CourseFormProps) {
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: course?.code || '',
      name: course?.name || '',
      description: course?.description || '',
      category_id: course?.category_id || '',
      instructor_id: course?.instructor_id || '',
      level: (course?.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
      duration_hours: course?.duration_hours || 1,
      thumbnail_url: course?.thumbnail_url || '',
      status: (course?.status || 'draft') as 'draft' | 'published' | 'archived',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>كود الدورة *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="مثال: CS101" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الدورة *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="مثال: مقدمة في البرمجة" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="وصف الدورة التدريبية..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المستوى *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المدة (ساعات) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحالة</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="published">منشور</SelectItem>
                    <SelectItem value="archived">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رابط الصورة المصغرة</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." type="url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : course ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
