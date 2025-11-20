/**
 * Alert Policy Dialog Component
 * Week 4 - Phase 2
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import { useAlertPolicies } from '@/modules/alerts/hooks/useAlertPolicies';
import type { AlertPolicy } from '@/modules/observability/types';

const formSchema = z.object({
  name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  metric: z.string().min(1, 'مطلوب'),
  operator: z.enum(['>', '<', '>=', '<=', '==', '!=']),
  threshold_value: z.number().min(0),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  is_enabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface AlertPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: AlertPolicy | null;
}

export function AlertPolicyDialog({ open, onOpenChange, policy }: AlertPolicyDialogProps) {
  const { createPolicy, updatePolicy } = useAlertPolicies();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      metric: 'completion_rate',
      operator: '<',
      threshold_value: 80,
      severity: 'warning',
      is_enabled: true,
    },
  });

  useEffect(() => {
    if (policy) {
      form.reset({
        name: policy.name,
        metric: policy.metric,
        operator: policy.operator as any,
        threshold_value: policy.threshold_value,
        severity: (policy.severity === 'warn' ? 'warning' : policy.severity) as any,
        is_enabled: policy.is_enabled,
      });
    } else {
      form.reset({
        name: '',
        metric: 'completion_rate',
        operator: '<',
        threshold_value: 80,
        severity: 'warning',
        is_enabled: true,
      });
    }
  }, [policy, form]);

  const onSubmit = (data: FormData) => {
    if (policy) {
      updatePolicy({ id: policy.id, data });
    } else {
      createPolicy(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {policy ? 'تعديل سياسة التنبيه' : 'إضافة سياسة تنبيه جديدة'}
          </DialogTitle>
          <DialogDescription>
            حدد شروط التنبيه ومستوى الخطورة
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم السياسة</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: معدل إكمال منخفض" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="metric"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المقياس</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="completion_rate">معدل الإكمال</SelectItem>
                        <SelectItem value="engagement_score">درجة التفاعل</SelectItem>
                        <SelectItem value="risk_score">درجة المخاطر</SelectItem>
                        <SelectItem value="compliance_rate">معدل الامتثال</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المعامل</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="<">أقل من</SelectItem>
                        <SelectItem value="<=">أقل من أو يساوي</SelectItem>
                        <SelectItem value=">">أكبر من</SelectItem>
                        <SelectItem value=">=">أكبر من أو يساوي</SelectItem>
                        <SelectItem value="==">يساوي</SelectItem>
                        <SelectItem value="!=">لا يساوي</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="threshold_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القيمة المحددة</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مستوى الخطورة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="info">معلومات</SelectItem>
                      <SelectItem value="warning">تحذير</SelectItem>
                      <SelectItem value="error">خطأ</SelectItem>
                      <SelectItem value="critical">حرج</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>تفعيل السياسة</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      تفعيل أو تعطيل التنبيهات لهذه السياسة
                    </div>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {policy ? 'تحديث' : 'إنشاء'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
