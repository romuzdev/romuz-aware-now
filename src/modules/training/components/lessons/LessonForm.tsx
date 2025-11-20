import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/core/components/ui/form';
import type { Lesson, ContentType } from '../../types';
import { createLessonSchema, lessonTypeEnum } from '../../types/lesson.types.validation';

// UI-friendly schema matching form fields
const lessonFormSchema = z.object({
  name: z.string().min(2, 'يجب أن يكون الاسم حرفين على الأقل').max(255),
  lesson_type: lessonTypeEnum,
  content: z.string().max(50000).optional().nullable(),
  video_url: z.string().url('رابط غير صحيح').max(500).optional().nullable().or(z.literal('')),
  duration_minutes: z.number().int().min(1).max(480).optional().nullable(),
  is_required: z.boolean().optional(),
});

type LessonFormData = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  lesson?: Lesson;
  position: number;
  onSubmit: (data: LessonFormData & { position: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LessonForm({ lesson, position, onSubmit, onCancel, isLoading }: LessonFormProps) {
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      name: lesson?.name || '',
      lesson_type: (lesson?.content_type || 'article') as any,
      content: lesson?.content || '',
      video_url: lesson?.content_url || '',
      duration_minutes: lesson?.estimated_minutes || undefined,
      is_required: lesson?.is_required ?? true,
    },
  });

  const lessonType = form.watch('lesson_type');

  const handleSubmit = (data: LessonFormData) => {
    onSubmit({ ...data, position });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الدرس *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="مثال: مقدمة في المتغيرات" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lesson_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع المحتوى *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المحتوى" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="article">مقال</SelectItem>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="quiz">اختبار</SelectItem>
                  <SelectItem value="assignment">تكليف</SelectItem>
                  <SelectItem value="scorm">SCORM</SelectItem>
                  <SelectItem value="external_link">رابط خارجي</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(lessonType === 'article' || lessonType === 'assignment') && (
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المحتوى</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="محتوى الدرس..."
                    rows={6}
                  />
                </FormControl>
                <FormDescription>
                  يمكنك استخدام HTML للتنسيق
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(lessonType === 'video' || lessonType === 'external_link' || lessonType === 'scorm') && (
          <FormField
            control={form.control}
            name="video_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رابط المحتوى *</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    value={field.value || ''}
                    placeholder="https://..." 
                    type="url" 
                  />
                </FormControl>
                <FormDescription>
                  {lessonType === 'video' && 'رابط الفيديو (YouTube, Vimeo، أو رابط مباشر)'}
                  {lessonType === 'external_link' && 'رابط خارجي'}
                  {lessonType === 'scorm' && 'رابط حزمة SCORM'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المدة المقدرة (دقائق)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">درس مطلوب</FormLabel>
                <FormDescription>
                  يجب على المتدربين إكمال هذا الدرس
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : lesson ? 'تحديث' : 'إضافة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
