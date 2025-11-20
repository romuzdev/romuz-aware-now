/**
 * GRC Audit Form Component
 * Form for creating/editing audits
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
import { useCreateAudit, useUpdateAudit } from '@/modules/grc';
import type { Audit } from '@/modules/grc';

const auditSchema = z.object({
  audit_code: z.string().min(1, 'الرمز مطلوب'),
  audit_title: z.string().min(1, 'العنوان مطلوب'),
  audit_title_ar: z.string().optional(),
  audit_description: z.string().optional(),
  audit_description_ar: z.string().optional(),
  audit_type: z.enum(['internal', 'external', 'compliance', 'operational', 'financial', 'it']),
  audit_status: z.enum(['planned', 'in_progress', 'fieldwork_complete', 'report_draft', 'report_final', 'closed']),
  audit_scope: z.string().optional(),
  planned_start_date: z.string().min(1, 'تاريخ البدء مطلوب'),
  planned_end_date: z.string().min(1, 'تاريخ الانتهاء مطلوب'),
});

type AuditFormValues = z.infer<typeof auditSchema>;

interface AuditFormProps {
  audit?: Audit;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AuditForm({ audit, onSuccess, onCancel }: AuditFormProps) {
  const createMutation = useCreateAudit();
  const updateMutation = useUpdateAudit();

  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: audit ? {
      audit_code: audit.audit_code,
      audit_title: audit.audit_title,
      audit_title_ar: audit.audit_title_ar || '',
      audit_description: audit.audit_description || '',
      audit_description_ar: audit.audit_description_ar || '',
      audit_type: audit.audit_type as any,
      audit_status: audit.audit_status as any,
      audit_scope: audit.audit_scope || '',
      planned_start_date: audit.planned_start_date || '',
      planned_end_date: audit.planned_end_date || '',
    } : {
      audit_code: '',
      audit_title: '',
      audit_title_ar: '',
      audit_description: '',
      audit_description_ar: '',
      audit_type: 'internal' as const,
      audit_status: 'planned' as const,
      audit_scope: '',
      planned_start_date: '',
      planned_end_date: '',
    },
  });

  const onSubmit = async (data: AuditFormValues) => {
    try {
      if (audit) {
        await updateMutation.mutateAsync({ id: audit.id, updates: data });
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
          name="audit_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رمز التدقيق *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="AUD-2025-001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="audit_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>العنوان (English) *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Internal Audit Q1 2025" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="audit_title_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>العنوان (العربية)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="التدقيق الداخلي الربع الأول 2025" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="audit_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع التدقيق *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="internal">داخلي</SelectItem>
                    <SelectItem value="external">خارجي</SelectItem>
                    <SelectItem value="compliance">امتثال</SelectItem>
                    <SelectItem value="operational">تشغيلي</SelectItem>
                    <SelectItem value="financial">مالي</SelectItem>
                    <SelectItem value="it">تقنية</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="audit_status"
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
                    <SelectItem value="planned">مخطط</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="fieldwork_complete">العمل الميداني مكتمل</SelectItem>
                    <SelectItem value="report_draft">مسودة التقرير</SelectItem>
                    <SelectItem value="report_final">التقرير النهائي</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="audit_scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>النطاق</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="IT Department" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="planned_start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ البدء المخطط *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="planned_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الانتهاء المخطط *</FormLabel>
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
          name="audit_description"
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
          name="audit_description_ar"
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
            {audit ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
