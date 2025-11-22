/**
 * GRC Platform - Risk Form Component
 * Dialog for creating and editing risks
 */

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
import {
  Form,
  FormControl,
  FormDescription,
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
import { Button } from '@/core/components/ui/button';
import { useCreateRisk, useUpdateRisk } from '@/modules/grc/hooks/useRisks';
import type { Risk } from '@/modules/grc/types';

const riskSchema = z.object({
  risk_code: z.string().min(1, 'كود المخاطرة مطلوب'),
  risk_title: z.string().min(3, 'عنوان المخاطرة مطلوب (3 أحرف على الأقل)'),
  risk_description: z.string().optional(),
  risk_category: z.enum([
    'strategic',
    'operational',
    'financial',
    'compliance',
    'reputational',
    'technology',
  ]),
  risk_type: z.enum(['threat', 'opportunity']).default('threat'),
  likelihood_score: z.number().min(1).max(5),
  impact_score: z.number().min(1).max(5),
  treatment_strategy: z
    .enum(['avoid', 'mitigate', 'transfer', 'accept'])
    .optional(),
  risk_appetite: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});

type RiskFormData = z.infer<typeof riskSchema>;

interface RiskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk?: Risk;
  mode?: 'create' | 'edit';
}

export function RiskForm({
  open,
  onOpenChange,
  risk,
  mode = 'create',
}: RiskFormProps) {
  const createMutation = useCreateRisk();
  const updateMutation = useUpdateRisk();

  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskSchema),
    defaultValues: risk
      ? {
          risk_code: risk.risk_code,
          risk_title: risk.risk_title,
          risk_description: risk.risk_description || '',
          risk_category: risk.risk_category,
          risk_type: risk.risk_type,
          likelihood_score: risk.likelihood_score,
          impact_score: risk.impact_score,
          treatment_strategy: risk.treatment_strategy,
          risk_appetite: risk.risk_appetite,
          notes: risk.notes || '',
        }
      : {
          risk_type: 'threat',
          likelihood_score: 3,
          impact_score: 3,
          risk_category: 'operational',
        },
  });

  const onSubmit = async (data: RiskFormData) => {
    try {
      if (mode === 'edit' && risk) {
        await updateMutation.mutateAsync({
          id: risk.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data as any);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting risk form:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'تعديل المخاطرة' : 'إضافة مخاطرة جديدة'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'تعديل بيانات المخاطرة'
              : 'إضافة مخاطرة جديدة إلى السجل'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Risk Code & Title */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="risk_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كود المخاطرة</FormLabel>
                    <FormControl>
                      <Input placeholder="R-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="strategic">استراتيجية</SelectItem>
                        <SelectItem value="operational">تشغيلية</SelectItem>
                        <SelectItem value="financial">مالية</SelectItem>
                        <SelectItem value="compliance">امتثال</SelectItem>
                        <SelectItem value="reputational">سمعة</SelectItem>
                        <SelectItem value="technology">تقنية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="risk_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان المخاطرة</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: فقدان البيانات الحساسة"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف تفصيلي للمخاطرة..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risk Type & Appetite */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="risk_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="threat">تهديد</SelectItem>
                        <SelectItem value="opportunity">فرصة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_appetite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرغبة في المخاطرة</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختياري" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Likelihood & Impact Scores */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="likelihood_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>احتمالية الحدوث (1-5)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - نادر جداً</SelectItem>
                        <SelectItem value="2">2 - نادر</SelectItem>
                        <SelectItem value="3">3 - محتمل</SelectItem>
                        <SelectItem value="4">4 - محتمل جداً</SelectItem>
                        <SelectItem value="5">5 - شبه مؤكد</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      احتمالية حدوث المخاطرة
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impact_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التأثير (1-5)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - ضئيل</SelectItem>
                        <SelectItem value="2">2 - منخفض</SelectItem>
                        <SelectItem value="3">3 - متوسط</SelectItem>
                        <SelectItem value="4">4 - عالي</SelectItem>
                        <SelectItem value="5">5 - كارثي</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      شدة التأثير عند حدوث المخاطرة
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Risk Score Display */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                درجة المخاطرة المحسوبة
              </div>
              <div className="text-2xl font-bold">
                {form.watch('likelihood_score') * form.watch('impact_score')}
              </div>
              <div className="text-sm text-muted-foreground">
                {form.watch('likelihood_score') *
                  form.watch('impact_score') >
                16
                  ? 'عالية جداً'
                  : form.watch('likelihood_score') *
                      form.watch('impact_score') >
                    12
                  ? 'عالية'
                  : form.watch('likelihood_score') *
                      form.watch('impact_score') >
                    8
                  ? 'متوسطة'
                  : 'منخفضة'}
              </div>
            </div>

            {/* Treatment Strategy */}
            <FormField
              control={form.control}
              name="treatment_strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>استراتيجية المعالجة (اختياري)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الاستراتيجية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="avoid">تجنب</SelectItem>
                      <SelectItem value="mitigate">تخفيف</SelectItem>
                      <SelectItem value="transfer">نقل</SelectItem>
                      <SelectItem value="accept">قبول</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ملاحظات إضافية..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'جاري الحفظ...'
                  : mode === 'edit'
                  ? 'حفظ التعديلات'
                  : 'إضافة المخاطرة'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
