/**
 * GRC Control Test Form Component
 * Form for creating/editing control tests
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Calendar } from '@/core/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ControlTest } from '@/modules/grc';

const controlTestSchema = z.object({
  test_code: z.string().min(1, 'كود الاختبار مطلوب'),
  test_title: z.string().min(1, 'عنوان الاختبار مطلوب'),
  test_description: z.string().optional(),
  test_date: z.date(),
  test_type: z.enum(['design', 'operating_effectiveness', 'compliance', 'walkthrough']),
  test_method: z.enum(['inspection', 'observation', 'inquiry', 'reperformance', 'analytical']),
  sample_size: z.number().optional(),
  test_result: z.enum(['passed', 'passed_with_exceptions', 'failed', 'not_applicable']),
  effectiveness_conclusion: z.enum(['effective', 'partially_effective', 'ineffective', 'not_determined']).optional(),
  test_findings: z.string().optional(),
});

type ControlTestFormValues = z.infer<typeof controlTestSchema>;

interface ControlTestFormProps {
  controlTest?: ControlTest;
  controlId: string;
  onSubmit: (data: ControlTestFormValues & { control_id: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ControlTestForm({
  controlTest,
  controlId,
  onSubmit,
  onCancel,
  isSubmitting,
}: ControlTestFormProps) {
  const form = useForm<ControlTestFormValues>({
    resolver: zodResolver(controlTestSchema),
    defaultValues: controlTest
      ? {
          test_code: controlTest.test_code,
          test_title: controlTest.test_title,
          test_description: controlTest.test_description || '',
          test_date: new Date(controlTest.test_date),
          test_type: controlTest.test_type as any,
          test_method: controlTest.test_method as any,
          sample_size: controlTest.sample_size || undefined,
          test_result: controlTest.test_result as any,
          effectiveness_conclusion: controlTest.effectiveness_conclusion as any,
          test_findings: controlTest.test_findings || '',
        }
      : {
          test_date: new Date(),
          test_type: 'operating_effectiveness',
          test_method: 'inspection',
          test_result: 'passed',
        },
  });

  const handleFormSubmit = (data: ControlTestFormValues) => {
    onSubmit({ ...data, control_id: controlId });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="test_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>كود الاختبار</FormLabel>
                <FormControl>
                  <Input placeholder="TST-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="test_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الاختبار</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-right font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>اختر التاريخ</span>}
                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="test_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان الاختبار</FormLabel>
              <FormControl>
                <Input placeholder="أدخل عنوان الاختبار" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="test_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف الاختبار</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل وصف تفصيلي للاختبار" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="test_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع الاختبار</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="design">اختبار التصميم</SelectItem>
                    <SelectItem value="operating_effectiveness">فعالية التشغيل</SelectItem>
                    <SelectItem value="compliance">اختبار الامتثال</SelectItem>
                    <SelectItem value="walkthrough">إجراء تفقدي</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="test_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>طريقة الاختبار</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطريقة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="inspection">الفحص</SelectItem>
                    <SelectItem value="observation">الملاحظة</SelectItem>
                    <SelectItem value="inquiry">الاستفسار</SelectItem>
                    <SelectItem value="reperformance">إعادة التنفيذ</SelectItem>
                    <SelectItem value="analytical">التحليلي</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sample_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>حجم العينة</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="test_result"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نتيجة الاختبار</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النتيجة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="passed">نجح</SelectItem>
                    <SelectItem value="passed_with_exceptions">نجح مع استثناءات</SelectItem>
                    <SelectItem value="failed">فشل</SelectItem>
                    <SelectItem value="not_applicable">غير قابل للتطبيق</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effectiveness_conclusion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>استنتاج الفعالية</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الاستنتاج" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="effective">فعال</SelectItem>
                    <SelectItem value="partially_effective">فعال جزئياً</SelectItem>
                    <SelectItem value="ineffective">غير فعال</SelectItem>
                    <SelectItem value="not_determined">غير محدد</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="test_findings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نتائج الاختبار</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل النتائج والملاحظات" rows={4} {...field} />
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
            {isSubmitting ? 'جاري الحفظ...' : controlTest ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
