/**
 * Risk Assessment Form Page
 * Multi-step form for creating/editing vendor risk assessments
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
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

const assessmentSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  assessment_type: z.string().min(1, 'Assessment type is required'),
  assessment_date: z.string().min(1, 'Assessment date is required'),
  assessor_name: z.string().min(1, 'Assessor name is required'),
  overall_risk_level: z.string().min(1, 'Overall risk level is required'),
  overall_risk_score: z.coerce.number().min(0).max(100).optional().nullable(),
  security_score: z.coerce.number().min(0).max(100).optional().nullable(),
  compliance_score: z.coerce.number().min(0).max(100).optional().nullable(),
  data_security_score: z.coerce.number().min(0).max(100).optional().nullable(),
  operational_risk_score: z.coerce.number().min(0).max(100).optional().nullable(),
  financial_risk_score: z.coerce.number().min(0).max(100).optional().nullable(),
  reputational_risk_score: z.coerce.number().min(0).max(100).optional().nullable(),
  executive_summary: z.string().optional().nullable(),
  key_findings: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  remediation_plan: z.string().optional().nullable(),
  next_review_date: z.string().optional().nullable(),
  status: z.string().default('pending'),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export default function RiskAssessmentForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, tenantId } = useAppContext();
  const isEditMode = !!id;

  const { data: assessment, isLoading: isLoadingAssessment } = useVendorRiskAssessmentById(id!, {
    enabled: isEditMode,
  });
  const { data: vendors, isLoading: isLoadingVendors } = useVendors();
  const createMutation = useCreateVendorRiskAssessment();
  const updateMutation = useUpdateVendorRiskAssessment();

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      vendor_id: '',
      assessment_type: 'initial',
      assessment_date: new Date().toISOString().split('T')[0],
      assessor_name: '',
      overall_risk_level: 'medium',
      status: 'pending',
      overall_risk_score: null,
      security_score: null,
      compliance_score: null,
      data_security_score: null,
      operational_risk_score: null,
      financial_risk_score: null,
      reputational_risk_score: null,
      executive_summary: null,
      key_findings: null,
      recommendations: null,
      remediation_plan: null,
      next_review_date: null,
    },
  });

  useEffect(() => {
    if (assessment && isEditMode) {
      form.reset({
        vendor_id: assessment.vendor_id,
        assessment_type: assessment.assessment_type || 'initial',
        assessment_date: assessment.assessment_date || new Date().toISOString().split('T')[0],
        assessor_name: assessment.assessor_name || '',
        overall_risk_level: assessment.overall_risk_level || 'medium',
        status: assessment.status || 'pending',
        overall_risk_score: assessment.overall_risk_score,
        security_score: assessment.security_score,
        compliance_score: assessment.compliance_score,
        data_security_score: assessment.data_security_score,
        operational_risk_score: assessment.operational_risk_score,
        financial_risk_score: assessment.financial_risk_score,
        reputational_risk_score: assessment.reputational_risk_score,
        executive_summary: assessment.executive_summary,
        key_findings: assessment.key_findings,
        recommendations: assessment.recommendations,
        remediation_plan: assessment.remediation_plan,
        next_review_date: assessment.next_review_date,
      });
    }
  }, [assessment, isEditMode, form]);

  const onSubmit = async (data: AssessmentFormData) => {
    if (!user?.id || !tenantId) {
      toast({
        title: t('common.error'),
        description: t('common.authRequired'),
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
        toast({
          title: t('common.success'),
          description: t('riskAssessment.updateSuccess'),
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: t('common.success'),
          description: t('riskAssessment.createSuccess'),
        });
      }
      navigate('/risk/assessments');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: isEditMode 
          ? t('riskAssessment.updateError')
          : t('riskAssessment.createError'),
        variant: 'destructive',
      });
    }
  };

  if (isLoadingAssessment || isLoadingVendors) {
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/risk/assessments')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? t('riskAssessment.editAssessment') : t('riskAssessment.newAssessment')}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vendor.vendor')} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isEditMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('vendor.selectVendor')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors?.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.vendor_name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assessment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.assessmentType')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="initial">Initial</SelectItem>
                          <SelectItem value="periodic">Periodic</SelectItem>
                          <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
                          <SelectItem value="renewal">Renewal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assessment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.assessmentDate')} *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assessor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.assessor')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overall_risk_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.overallRiskLevel')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.status')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_review_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.nextReviewDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Risk Scores */}
          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.riskScores')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="overall_risk_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.overallScore')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="security_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.securityScore')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="compliance_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.complianceScore')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_security_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.dataSecurity')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operational_risk_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.operationalRisk')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financial_risk_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.financialRisk')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reputational_risk_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('riskAssessment.reputationalRisk')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assessment Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.assessmentDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="executive_summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('riskAssessment.executiveSummary')}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="key_findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('riskAssessment.keyFindings')}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('riskAssessment.recommendations')}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remediation_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('riskAssessment.remediationPlan')}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/risk/assessments')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
