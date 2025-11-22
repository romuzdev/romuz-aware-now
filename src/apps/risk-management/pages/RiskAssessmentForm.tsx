/**
 * Risk Assessment Form Page
 * Multi-step form for creating/editing vendor risk assessments
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  useVendorRiskAssessmentById,
  useCreateVendorRiskAssessment,
  useUpdateVendorRiskAssessment,
  useVendors
} from '@/modules/grc/hooks/useThirdPartyRisk';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function RiskAssessmentForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, tenantId } = useAppContext();
  const isEditMode = !!id;

  const { data: assessment, isLoading } = useVendorRiskAssessmentById(id!);
  const { data: vendors } = useVendors();
  const createMutation = useCreateVendorRiskAssessment();
  const updateMutation = useUpdateVendorRiskAssessment();

  const formSchema = z.object({
    vendor_id: z.string().min(1, 'المورد مطلوب'),
    assessment_code: z.string().min(1, 'رمز التقييم مطلوب'),
    assessment_date: z.string().min(1, 'تاريخ التقييم مطلوب'),
    assessment_type: z.string().min(1, 'نوع التقييم مطلوب'),
    assessor_name: z.string().min(1, 'اسم المقيّم مطلوب'),
    assessor_user_id: z.string().min(1, 'معرف المقيّم مطلوب'),
    security_risk_score: z.number().min(0).max(10),
    compliance_risk_score: z.number().min(0).max(10),
    operational_risk_score: z.number().min(0).max(10),
    financial_risk_score: z.number().min(0).max(10),
    reputational_risk_score: z.number().min(0).max(10),
    overall_risk_score: z.number().min(0).max(10),
    overall_risk_level: z.string().min(1, 'مستوى المخاطر الإجمالي مطلوب'),
    recommendations_ar: z.string().optional(),
    status: z.string().min(1, 'الحالة مطلوبة'),
    notes_ar: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendor_id: '',
      assessment_code: '',
      assessment_date: new Date().toISOString().split('T')[0],
      assessment_type: '',
      assessor_name: user?.email || '',
      assessor_user_id: user?.id || '',
      security_risk_score: 0,
      compliance_risk_score: 0,
      operational_risk_score: 0,
      financial_risk_score: 0,
      reputational_risk_score: 0,
      overall_risk_score: 0,
      overall_risk_level: 'low',
      recommendations_ar: '',
      status: 'draft',
      notes_ar: '',
    },
  });

  useEffect(() => {
    if (assessment && isEditMode) {
      form.reset({
        vendor_id: assessment.vendor_id,
        assessment_code: assessment.assessment_code,
        assessment_date: assessment.assessment_date,
        assessment_type: assessment.assessment_type,
        assessor_name: assessment.assessor_name,
        assessor_user_id: assessment.assessor_user_id,
        security_risk_score: assessment.security_risk_score,
        compliance_risk_score: assessment.compliance_risk_score,
        operational_risk_score: assessment.operational_risk_score,
        financial_risk_score: assessment.financial_risk_score,
        reputational_risk_score: assessment.reputational_risk_score,
        overall_risk_score: assessment.overall_risk_score,
        overall_risk_level: assessment.overall_risk_level,
        recommendations_ar: assessment.recommendations_ar || '',
        status: assessment.status,
        notes_ar: assessment.notes_ar || '',
      });
    }
  }, [assessment, isEditMode, form]);

  const onSubmit = async (data: FormData) => {
    if (!user?.id || !tenantId) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = {
        ...data,
        tenant_id: tenantId,
        created_by: user.id,
        updated_by: user.id,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({ id: id!, updates: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/risk/assessments');
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/risk/assessments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'تعديل تقييم المخاطر' : 'تقييم مخاطر جديد'}
          </h1>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_id">المورد *</Label>
                <Select
                  value={form.watch('vendor_id')}
                  onValueChange={(value) => form.setValue('vendor_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.vendor_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.vendor_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment_code">رمز التقييم *</Label>
                <Input id="assessment_code" {...form.register('assessment_code')} />
                {form.formState.errors.assessment_code && (
                  <p className="text-sm text-destructive">{form.formState.errors.assessment_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment_date">تاريخ التقييم *</Label>
                <Input id="assessment_date" type="date" {...form.register('assessment_date')} />
                {form.formState.errors.assessment_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.assessment_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment_type">نوع التقييم *</Label>
                <Select
                  value={form.watch('assessment_type')}
                  onValueChange={(value) => form.setValue('assessment_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">أولي</SelectItem>
                    <SelectItem value="periodic">دوري</SelectItem>
                    <SelectItem value="ad_hoc">طارئ</SelectItem>
                    <SelectItem value="renewal">تجديد</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.assessment_type && (
                  <p className="text-sm text-destructive">{form.formState.errors.assessment_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessor_name">اسم المقيّم *</Label>
                <Input id="assessor_name" {...form.register('assessor_name')} />
                {form.formState.errors.assessor_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.assessor_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">الحالة *</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Scores */}
        <Card>
          <CardHeader>
            <CardTitle>درجات المخاطر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="security_risk_score">المخاطر الأمنية (0-10)</Label>
                <Input
                  id="security_risk_score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  {...form.register('security_risk_score', { valueAsNumber: true })}
                />
                {form.formState.errors.security_risk_score && (
                  <p className="text-sm text-destructive">{form.formState.errors.security_risk_score.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="compliance_risk_score">مخاطر الامتثال (0-10)</Label>
                <Input
                  id="compliance_risk_score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  {...form.register('compliance_risk_score', { valueAsNumber: true })}
                />
                {form.formState.errors.compliance_risk_score && (
                  <p className="text-sm text-destructive">{form.formState.errors.compliance_risk_score.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="operational_risk_score">المخاطر التشغيلية (0-10)</Label>
                <Input
                  id="operational_risk_score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  {...form.register('operational_risk_score', { valueAsNumber: true })}
                />
                {form.formState.errors.operational_risk_score && (
                  <p className="text-sm text-destructive">{form.formState.errors.operational_risk_score.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="financial_risk_score">المخاطر المالية (0-10)</Label>
                <Input
                  id="financial_risk_score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  {...form.register('financial_risk_score', { valueAsNumber: true })}
                />
                {form.formState.errors.financial_risk_score && (
                  <p className="text-sm text-destructive">{form.formState.errors.financial_risk_score.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reputational_risk_score">المخاطر السمعية (0-10)</Label>
                <Input
                  id="reputational_risk_score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  {...form.register('reputational_risk_score', { valueAsNumber: true })}
                />
                {form.formState.errors.reputational_risk_score && (
                  <p className="text-sm text-destructive">{form.formState.errors.reputational_risk_score.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="overall_risk_score">الدرجة الإجمالية (0-10)</Label>
                <Input
                  id="overall_risk_score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  {...form.register('overall_risk_score', { valueAsNumber: true })}
                />
                {form.formState.errors.overall_risk_score && (
                  <p className="text-sm text-destructive">{form.formState.errors.overall_risk_score.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="overall_risk_level">مستوى المخاطر الإجمالي *</Label>
                <Select
                  value={form.watch('overall_risk_level')}
                  onValueChange={(value) => form.setValue('overall_risk_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="critical">حرج</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.overall_risk_level && (
                  <p className="text-sm text-destructive">{form.formState.errors.overall_risk_level.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recommendations_ar">التوصيات</Label>
              <Textarea
                id="recommendations_ar"
                rows={4}
                {...form.register('recommendations_ar')}
              />
              {form.formState.errors.recommendations_ar && (
                <p className="text-sm text-destructive">{form.formState.errors.recommendations_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes_ar">ملاحظات</Label>
              <Textarea
                id="notes_ar"
                rows={3}
                {...form.register('notes_ar')}
              />
              {form.formState.errors.notes_ar && (
                <p className="text-sm text-destructive">{form.formState.errors.notes_ar.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/risk/assessments')}>
            إلغاء
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            حفظ
          </Button>
        </div>
      </form>
    </div>
  );
}