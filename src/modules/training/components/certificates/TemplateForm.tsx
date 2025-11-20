import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/core/components/ui/form';

const templateSchema = z.object({
  name: z.string().min(3, 'يجب أن يكون الاسم 3 أحرف على الأقل'),
  description: z.string().optional(),
  header_text: z.string().min(5, 'نص الرأس مطلوب'),
  body_template: z.string().min(10, 'نص الشهادة مطلوب'),
  footer_text: z.string().optional(),
  signature_fields: z.string().optional(),
  is_default: z.boolean().optional(),
  validity_days: z.number().positive('يجب أن تكون المدة رقم موجب').optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  template?: any;
  onSubmit: (data: TemplateFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TemplateForm({ template, onSubmit, onCancel, isLoading }: TemplateFormProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      header_text: template?.header_text || 'شهادة إتمام دورة',
      body_template: template?.body_template || 'نشهد بأن {{user_name}} قد أتم بنجاح دورة {{course_name}} بتاريخ {{completion_date}}',
      footer_text: template?.footer_text || '',
      signature_fields: template?.signature_fields ? JSON.stringify(template.signature_fields) : '',
      is_default: template?.is_default ?? false,
      validity_days: template?.validity_days || undefined,
    },
  });

  const handleSubmit = (data: TemplateFormData) => {
    const submitData = {
      ...data,
      signature_fields: data.signature_fields ? JSON.parse(data.signature_fields) : undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم القالب *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="مثال: شهادة الدورة الأساسية" />
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
                <Textarea {...field} placeholder="وصف القالب..." rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="header_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نص الرأس *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="شهادة إتمام دورة" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نص الشهادة *</FormLabel>
              <FormControl>
                <Textarea {...field} rows={5} />
              </FormControl>
              <FormDescription>
                استخدم المتغيرات: {'{'}{'{'} user_name {'}'}{'}'}، {'{'}{'{'} course_name {'}'}{'}'}، {'{'}{'{'} completion_date {'}'}{'}'}، {'{'}{'{'} score {'}'}{'}'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="footer_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نص التذييل</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="نص إضافي في أسفل الشهادة..." rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="validity_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>مدة صلاحية الشهادة (بالأيام)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  value={field.value || ''}
                  placeholder="اتركه فارغاً للصلاحية الدائمة"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">قالب افتراضي</FormLabel>
                <FormDescription>
                  استخدام هذا القالب كافتراضي للدورات الجديدة
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : template ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
