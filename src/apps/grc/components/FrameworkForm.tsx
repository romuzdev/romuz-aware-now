/**
 * GRC Framework Form Component
 * Form for creating/editing compliance frameworks
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { useCreateComplianceFramework, useUpdateComplianceFramework } from '@/modules/grc';
import type { ComplianceFramework } from '@/modules/grc';

const frameworkSchema = z.object({
  framework_code: z.string().min(1, 'الرمز مطلوب'),
  framework_name: z.string().min(1, 'الاسم مطلوب'),
  framework_name_ar: z.string().optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  framework_type: z.enum(['regulatory', 'industry_standard', 'best_practice', 'internal']),
  framework_status: z.enum(['active', 'deprecated', 'under_review']),
  framework_version: z.string().optional(),
  issuing_authority: z.string().optional(),
  effective_date: z.string().optional(),
  external_url: z.string().url().optional().or(z.literal('')),
});

type FrameworkFormValues = z.infer<typeof frameworkSchema>;

interface FrameworkFormProps {
  framework?: ComplianceFramework;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FrameworkForm({ framework, onSuccess, onCancel }: FrameworkFormProps) {
  const createMutation = useCreateComplianceFramework();
  const updateMutation = useUpdateComplianceFramework();

  const form = useForm<FrameworkFormValues>({
    resolver: zodResolver(frameworkSchema),
    defaultValues: framework ? {
      framework_code: framework.framework_code,
      framework_name: framework.framework_name,
      framework_name_ar: framework.framework_name_ar || '',
      description: framework.description || '',
      description_ar: framework.description_ar || '',
      framework_type: framework.framework_type as any,
      framework_status: framework.framework_status as any,
      framework_version: framework.framework_version || '',
      issuing_authority: framework.issuing_authority || '',
      effective_date: framework.effective_date || '',
      external_url: framework.external_url || '',
    } : {
      framework_code: '',
      framework_name: '',
      framework_name_ar: '',
      description: '',
      description_ar: '',
      framework_type: 'regulatory' as const,
      framework_status: 'active' as const,
      framework_version: '',
      issuing_authority: '',
      effective_date: '',
      external_url: '',
    },
  });

  const onSubmit = async (data: FrameworkFormValues) => {
    try {
      if (framework) {
        await updateMutation.mutateAsync({ id: framework.id, updates: data });
      } else {
        await createMutation.mutateAsync(data as any);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="framework_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الرمز *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ISO-27001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="framework_version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الإصدار</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="2013" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="framework_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم (English) *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ISO/IEC 27001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="framework_name_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم (العربية)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="أيزو/آي إي سي 27001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="framework_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>النوع *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="regulatory">تنظيمي</SelectItem>
                    <SelectItem value="industry_standard">معيار صناعي</SelectItem>
                    <SelectItem value="best_practice">أفضل الممارسات</SelectItem>
                    <SelectItem value="internal">داخلي</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="framework_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحالة *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="deprecated">متوقف</SelectItem>
                    <SelectItem value="under_review">قيد المراجعة</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issuing_authority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الجهة المصدرة</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ISO/IEC" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effective_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ السريان</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="external_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الرابط الخارجي</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." />
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
              <FormLabel>الوصف (English)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف (العربية)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {framework ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
