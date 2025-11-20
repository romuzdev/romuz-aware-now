/**
 * GRC Platform - Risk Assessment Form Component
 * Dialog for creating risk assessments
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
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRiskAssessment } from '@/modules/grc/integration';
import { toast } from 'sonner';
import type { RiskLevel } from '@/modules/grc/types';

const assessmentSchema = z.object({
  likelihood_score: z.number().min(1).max(5),
  impact_score: z.number().min(1).max(5),
  risk_level: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  assessment_type: z
    .enum(['initial', 'periodic', 'ad_hoc', 'incident_triggered'])
    .default('periodic'),
  assessment_method: z
    .enum(['qualitative', 'quantitative', 'semi_quantitative'])
    .optional(),
  scenario_description: z.string().optional(),
  key_findings: z.string().optional(),
  recommendations: z.string().optional(),
  control_effectiveness_rating: z
    .enum(['effective', 'partially_effective', 'ineffective', 'not_applicable'])
    .optional(),
  notes: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface RiskAssessmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskId: string;
  riskTitle: string;
}

export function RiskAssessmentForm({
  open,
  onOpenChange,
  riskId,
  riskTitle,
}: RiskAssessmentFormProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: AssessmentFormData) =>
      createRiskAssessment({
        risk_id: riskId,
        ...data,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc-risks'] });
      toast.success('تم إنشاء التقييم بنجاح');
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error('فشل إنشاء التقييم');
    },
  });

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      likelihood_score: 3,
      impact_score: 3,
      risk_level: 'medium',
      assessment_type: 'periodic',
    },
  });

  const calculateRiskLevel = (
    likelihood: number,
    impact: number
  ): RiskLevel => {
    const score = likelihood * impact;
    if (score <= 4) return 'very_low';
    if (score <= 8) return 'low';
    if (score <= 12) return 'medium';
    if (score <= 16) return 'high';
    return 'very_high';
  };

  // Auto-calculate risk level when scores change
  const watchLikelihood = form.watch('likelihood_score');
  const watchImpact = form.watch('impact_score');

  const onSubmit = async (data: AssessmentFormData) => {
    const riskLevel = calculateRiskLevel(data.likelihood_score, data.impact_score);
    await createMutation.mutateAsync({
      ...data,
      risk_level: riskLevel,
    });
  };

  const currentRiskScore = watchLikelihood * watchImpact;
  const currentRiskLevel = calculateRiskLevel(watchLikelihood, watchImpact);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تقييم المخاطرة</DialogTitle>
          <DialogDescription>{riskTitle}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Assessment Type */}
            <FormField
              control={form.control}
              name="assessment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع التقييم</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="initial">أولي</SelectItem>
                      <SelectItem value="periodic">دوري</SelectItem>
                      <SelectItem value="ad_hoc">طارئ</SelectItem>
                      <SelectItem value="incident_triggered">
                        بسبب حادثة
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Likelihood & Impact */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="likelihood_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>احتمالية الحدوث (1-5)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value.toString()}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impact_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شدة التأثير (1-5)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value.toString()}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Risk Score Display */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  درجة المخاطرة
                </span>
                <span className="text-3xl font-bold">{currentRiskScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  مستوى المخاطرة
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentRiskLevel === 'very_high'
                      ? 'bg-destructive/10 text-destructive'
                      : currentRiskLevel === 'high'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                      : currentRiskLevel === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  }`}
                >
                  {currentRiskLevel === 'very_high'
                    ? 'عالية جداً'
                    : currentRiskLevel === 'high'
                    ? 'عالية'
                    : currentRiskLevel === 'medium'
                    ? 'متوسطة'
                    : currentRiskLevel === 'low'
                    ? 'منخفضة'
                    : 'منخفضة جداً'}
                </span>
              </div>
            </div>

            {/* Assessment Method */}
            <FormField
              control={form.control}
              name="assessment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>منهجية التقييم (اختياري)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنهجية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="qualitative">نوعي</SelectItem>
                      <SelectItem value="quantitative">كمي</SelectItem>
                      <SelectItem value="semi_quantitative">
                        شبه كمي
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scenario Description */}
            <FormField
              control={form.control}
              name="scenario_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف السيناريو (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف سيناريو حدوث المخاطرة..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key Findings */}
            <FormField
              control={form.control}
              name="key_findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>النتائج الرئيسية (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أهم نتائج التقييم..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recommendations */}
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التوصيات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توصيات للمعالجة..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Control Effectiveness */}
            <FormField
              control={form.control}
              name="control_effectiveness_rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>فعالية الضوابط الحالية (اختياري)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="تقييم فعالية الضوابط" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="effective">فعالة</SelectItem>
                      <SelectItem value="partially_effective">
                        فعالة جزئياً
                      </SelectItem>
                      <SelectItem value="ineffective">غير فعالة</SelectItem>
                      <SelectItem value="not_applicable">
                        غير قابلة للتطبيق
                      </SelectItem>
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
                  <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ملاحظات عامة..."
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
                disabled={createMutation.isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? 'جاري الحفظ...'
                  : 'حفظ التقييم'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
