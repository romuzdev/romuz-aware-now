// ============================================================================
// Gate-E: Policy Form Dialog Component
// ============================================================================

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import { useAlertPolicies } from '@/features/observability/hooks/useAlertPolicies';
import type { AlertPolicy, CreateAlertPolicyData } from '@/modules/observability';

const policySchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  scope: z.enum(['campaign', 'tenant', 'platform']),
  metric: z.enum(['open_rate', 'click_rate', 'activation_rate', 'completion_rate', 'bounce_rate']),
  time_window: z.enum(['daily', 'ctd']),
  operator: z.enum(['<', '<=', '>=', '>', 'delta_pct', 'mom', 'wow']),
  threshold_value: z.number().min(0).max(100),
  severity: z.enum(['info', 'warn', 'critical']),
  is_enabled: z.boolean().default(true),
  notify_cooldown_minutes: z.number().min(5).default(60),
});

type PolicyFormData = z.infer<typeof policySchema>;

interface PolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: AlertPolicy | null;
}

export function PolicyFormDialog({ open, onOpenChange, policy }: PolicyFormDialogProps) {
  const { createPolicy, updatePolicy } = useAlertPolicies();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      scope: 'campaign',
      metric: 'completion_rate',
      time_window: 'ctd',
      operator: '<=',
      threshold_value: 50,
      severity: 'warn',
      is_enabled: true,
      notify_cooldown_minutes: 60,
    },
  });

  const isEnabled = watch('is_enabled');
  const selectedScope = watch('scope');
  const selectedMetric = watch('metric');
  const selectedOperator = watch('operator');
  const selectedSeverity = watch('severity');
  const selectedTimeWindow = watch('time_window');

  useEffect(() => {
    if (policy) {
      setValue('name', policy.name);
      setValue('scope', policy.scope as any);
      setValue('metric', policy.metric as any);
      setValue('time_window', policy.time_window as any);
      setValue('operator', policy.operator as any);
      setValue('threshold_value', policy.threshold_value);
      setValue('severity', policy.severity as any);
      setValue('is_enabled', policy.is_enabled);
      setValue('notify_cooldown_minutes', policy.notify_cooldown_minutes);
    } else {
      reset();
    }
  }, [policy, setValue, reset]);

  const onSubmit = (data: PolicyFormData) => {
    const payload: CreateAlertPolicyData = {
      name: data.name,
      scope: data.scope,
      metric: data.metric,
      time_window: data.time_window,
      operator: data.operator,
      threshold_value: data.threshold_value,
      severity: data.severity,
      is_enabled: data.is_enabled,
      notify_cooldown_minutes: data.notify_cooldown_minutes,
    };

    if (policy) {
      updatePolicy({ id: policy.id, data: payload });
    } else {
      createPolicy(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? 'تعديل السياسة' : 'إضافة سياسة جديدة'}</DialogTitle>
          <DialogDescription>
            تحديد متى يتم إطلاق تنبيهات بناءً على مقاييس الأداء
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم</Label>
            <Input {...register('name')} placeholder="مثال: تنبيه انخفاض معدل الإنجاز" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>النطاق</Label>
              <Select value={selectedScope} onValueChange={(v) => setValue('scope', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign">حملة</SelectItem>
                  <SelectItem value="tenant">مؤسسة</SelectItem>
                  <SelectItem value="platform">منصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المقياس</Label>
              <Select value={selectedMetric} onValueChange={(v) => setValue('metric', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_rate">معدل الفتح</SelectItem>
                  <SelectItem value="click_rate">معدل النقر</SelectItem>
                  <SelectItem value="activation_rate">معدل التفعيل</SelectItem>
                  <SelectItem value="completion_rate">معدل الإنجاز</SelectItem>
                  <SelectItem value="bounce_rate">معدل الارتداد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select value={selectedTimeWindow} onValueChange={(v) => setValue('time_window', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="ctd">من بداية الحملة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>العامل</Label>
              <Select value={selectedOperator} onValueChange={(v) => setValue('operator', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<">أقل من (&lt;)</SelectItem>
                  <SelectItem value="<=">أقل من أو يساوي (&lt;=)</SelectItem>
                  <SelectItem value=">">أكبر من (&gt;)</SelectItem>
                  <SelectItem value=">=">أكبر من أو يساوي (&gt;=)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>القيمة الحدية (%)</Label>
              <Input
                type="number"
                {...register('threshold_value', { valueAsNumber: true })}
                placeholder="50"
                min="0"
                max="100"
              />
              {errors.threshold_value && <p className="text-sm text-destructive">{errors.threshold_value.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>الأهمية</Label>
              <Select value={selectedSeverity} onValueChange={(v) => setValue('severity', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومات</SelectItem>
                  <SelectItem value="warn">تحذير</SelectItem>
                  <SelectItem value="critical">حرج</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>فترة التهدئة (بالدقائق)</Label>
            <Input
              type="number"
              {...register('notify_cooldown_minutes', { valueAsNumber: true })}
              placeholder="60"
              min="5"
            />
            {errors.notify_cooldown_minutes && (
              <p className="text-sm text-destructive">{errors.notify_cooldown_minutes.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-enabled">تفعيل السياسة</Label>
            <Switch
              id="is-enabled"
              checked={isEnabled}
              onCheckedChange={(checked) => setValue('is_enabled', checked)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              {policy ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
