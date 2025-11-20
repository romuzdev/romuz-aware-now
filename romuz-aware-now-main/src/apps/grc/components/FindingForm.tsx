/**
 * GRC Finding Form Component
 * Form for creating/editing audit findings
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
import { useCreateAuditFinding, useUpdateAuditFinding } from '@/modules/grc';
import type { AuditFinding } from '@/modules/grc';

const findingSchema = z.object({
  audit_id: z.string().min(1, 'التدقيق مطلوب'),
  finding_code: z.string().min(1, 'الرمز مطلوب'),
  finding_title: z.string().min(1, 'العنوان مطلوب'),
  finding_title_ar: z.string().optional(),
  finding_description: z.string().optional(),
  finding_description_ar: z.string().optional(),
  finding_type: z.enum(['deficiency', 'observation', 'opportunity', 'non_compliance']),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'informational']),
  finding_status: z.enum(['open', 'in_progress', 'resolved', 'verified', 'accepted_risk', 'closed']),
  identified_date: z.string().min(1, 'تاريخ الاكتشاف مطلوب'),
  target_closure_date: z.string().optional(),
});

type FindingFormValues = z.infer<typeof findingSchema>;

interface FindingFormProps {
  finding?: AuditFinding;
  auditId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FindingForm({ finding, auditId, onSuccess, onCancel }: FindingFormProps) {
  const createMutation = useCreateAuditFinding();
  const updateMutation = useUpdateAuditFinding();

  const form = useForm<FindingFormValues>({
    resolver: zodResolver(findingSchema),
    defaultValues: finding ? {
      audit_id: finding.audit_id,
      finding_code: finding.finding_code,
      finding_title: finding.finding_title,
      finding_title_ar: finding.finding_title_ar || '',
      finding_description: finding.finding_description || '',
      finding_description_ar: finding.finding_description_ar || '',
      finding_type: finding.finding_type as any,
      severity: finding.severity as any,
      finding_status: finding.finding_status as any,
      identified_date: finding.identified_date || '',
      target_closure_date: finding.target_closure_date || '',
    } : {
      audit_id: auditId || '',
      finding_code: '',
      finding_title: '',
      finding_title_ar: '',
      finding_description: '',
      finding_description_ar: '',
      finding_type: 'deficiency' as const,
      severity: 'medium' as const,
      finding_status: 'open' as const,
      identified_date: new Date().toISOString().split('T')[0],
      target_closure_date: '',
    },
  });

  const onSubmit = async (data: FindingFormValues) => {
    try {
      if (finding) {
        await updateMutation.mutateAsync({ id: finding.id, updates: data });
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
        <FormField
          control={form.control}
          name="finding_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رمز النتيجة *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="F-001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="finding_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>العنوان (English) *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Security Policy Gap" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="finding_title_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>العنوان (العربية)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="فجوة في سياسة الأمن" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="finding_type"
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
                    <SelectItem value="deficiency">قصور</SelectItem>
                    <SelectItem value="observation">ملاحظة</SelectItem>
                    <SelectItem value="opportunity">فرصة</SelectItem>
                    <SelectItem value="non_compliance">عدم امتثال</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الخطورة *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخطورة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="critical">حرجة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="informational">معلوماتية</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="finding_status"
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
                    <SelectItem value="open">مفتوحة</SelectItem>
                    <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                    <SelectItem value="resolved">تم الحل</SelectItem>
                    <SelectItem value="verified">تم التحقق</SelectItem>
                    <SelectItem value="accepted_risk">مخاطر مقبولة</SelectItem>
                    <SelectItem value="closed">مغلقة</SelectItem>
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
            name="identified_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الاكتشاف *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_closure_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الإغلاق المستهدف</FormLabel>
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
          name="finding_description"
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
          name="finding_description_ar"
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
            {finding ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
