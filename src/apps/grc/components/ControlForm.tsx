/**
 * GRC Control Form Component
 * Form for creating/editing controls
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import type { Control } from '@/modules/grc';

const controlSchema = z.object({
  control_code: z.string().min(1, 'كود الرقابة مطلوب'),
  control_title: z.string().min(1, 'عنوان الرقابة مطلوب'),
  control_description: z.string().optional(),
  control_objective: z.string().optional(),
  control_type: z.enum(['preventive', 'detective', 'corrective', 'directive']),
  control_category: z.enum([
    'access_control',
    'data_protection',
    'physical_security',
    'operational',
    'technical',
    'administrative',
    'compliance',
  ]),
  control_nature: z.enum(['manual', 'automated', 'hybrid']),
  testing_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc']),
  control_status: z.enum(['draft', 'active', 'inactive', 'retired']).default('draft'),
  control_procedures: z.string().optional(),
});

type ControlFormValues = z.infer<typeof controlSchema>;

interface ControlFormProps {
  control?: Control;
  onSubmit: (data: ControlFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ControlForm({ control, onSubmit, onCancel, isSubmitting }: ControlFormProps) {
  const form = useForm<ControlFormValues>({
    resolver: zodResolver(controlSchema),
    defaultValues: control
      ? {
          control_code: control.control_code,
          control_title: control.control_title,
          control_description: control.control_description || '',
          control_objective: control.control_objective || '',
          control_type: control.control_type as any,
          control_category: control.control_category as any,
          control_nature: control.control_nature as any,
          testing_frequency: control.testing_frequency as any,
          control_status: control.control_status as any,
          control_procedures: control.control_procedures || '',
        }
      : {
          control_status: 'draft',
          control_type: 'preventive',
          control_category: 'operational',
          control_nature: 'manual',
          testing_frequency: 'quarterly',
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="control_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>كود الرقابة</FormLabel>
                <FormControl>
                  <Input placeholder="CTL-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="control_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>حالة الرقابة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="retired">متقاعد</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="control_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان الرقابة</FormLabel>
              <FormControl>
                <Input placeholder="أدخل عنوان الرقابة" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="control_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف الرقابة</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل وصف تفصيلي للرقابة" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="control_objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>هدف الرقابة</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل الهدف من الرقابة" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="control_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع الرقابة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="preventive">وقائية</SelectItem>
                    <SelectItem value="detective">كاشفة</SelectItem>
                    <SelectItem value="corrective">تصحيحية</SelectItem>
                    <SelectItem value="directive">توجيهية</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="control_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تصنيف الرقابة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="access_control">التحكم في الوصول</SelectItem>
                    <SelectItem value="data_protection">حماية البيانات</SelectItem>
                    <SelectItem value="physical_security">الأمن المادي</SelectItem>
                    <SelectItem value="operational">تشغيلية</SelectItem>
                    <SelectItem value="technical">تقنية</SelectItem>
                    <SelectItem value="administrative">إدارية</SelectItem>
                    <SelectItem value="compliance">الامتثال</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="control_nature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>طبيعة الرقابة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطبيعة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">يدوية</SelectItem>
                    <SelectItem value="automated">آلية</SelectItem>
                    <SelectItem value="hybrid">مختلطة</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="testing_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تكرار الاختبار</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التكرار" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="annually">سنوي</SelectItem>
                  <SelectItem value="ad_hoc">حسب الحاجة</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="control_procedures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>إجراءات الرقابة</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل الإجراءات التفصيلية" rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : control ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
