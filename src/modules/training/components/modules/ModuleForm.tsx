import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/core/components/ui/form';
import type { CourseModule } from '../../types';
import { createModuleSchema, type ModuleCreateInput } from '../../types/module.types.validation';

// Omit server-side fields for form usage
type ModuleFormData = Omit<ModuleCreateInput, 'course_id' | 'position'>;

interface ModuleFormProps {
  module?: CourseModule;
  position: number;
  onSubmit: (data: ModuleFormData & { position: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ModuleForm({ module, position, onSubmit, onCancel, isLoading }: ModuleFormProps) {
  const form = useForm<ModuleFormData>({
    resolver: zodResolver(createModuleSchema.omit({ course_id: true, position: true })),
    defaultValues: {
      name: module?.name || '',
      description: module?.description || '',
      estimated_minutes: module?.estimated_minutes || undefined,
      is_required: module?.is_required ?? true,
    },
  });

  const handleSubmit = (data: ModuleFormData) => {
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
              <FormLabel>اسم الوحدة *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="مثال: مقدمة في البرمجة" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="وصف الوحدة..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimated_minutes"
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
                <FormLabel className="text-base">وحدة مطلوبة</FormLabel>
                <FormDescription>
                  يجب على المتدربين إكمال هذه الوحدة
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
            {isLoading ? 'جاري الحفظ...' : module ? 'تحديث' : 'إضافة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
