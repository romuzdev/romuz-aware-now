/**
 * GRC Platform - Risk Details Page
 * Detailed view of a single risk with assessments and treatment plans
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { useRiskById, useDeleteRisk } from '@/modules/grc/hooks/useRisks';
import { RiskForm, RiskAssessmentForm } from '../components';
import { useState } from 'react';
import { formatDate } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function RiskDetails() {
  const { riskId } = useParams<{ riskId: string }>();
  const navigate = useNavigate();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAssessmentFormOpen, setIsAssessmentFormOpen] = useState(false);

  const { data: risk, isLoading } = useRiskById(riskId);
  const deleteMutation = useDeleteRisk();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">
          المخاطرة غير موجودة
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('هل أنت متأكد من حذف هذه المخاطرة?')) {
      await deleteMutation.mutateAsync(risk.id);
      navigate('/grc/risks');
    }
  };

  const getRiskLevelColor = (score: number) => {
    if (score > 16) return 'bg-destructive/10 text-destructive';
    if (score > 12)
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    if (score > 8)
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  };

  const getRiskLevelText = (score: number) => {
    if (score > 16) return 'عالية جداً';
    if (score > 12) return 'عالية';
    if (score > 8) return 'متوسطة';
    if (score > 4) return 'منخفضة';
    return 'منخفضة جداً';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/grc/risks')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة إلى سجل المخاطر
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">
              {risk.risk_code}
            </span>
            <h1 className="text-3xl font-bold">{risk.risk_title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{risk.risk_category}</Badge>
            <Badge variant="outline">{risk.risk_status}</Badge>
            <Badge className={getRiskLevelColor(risk.inherent_risk_score)}>
              {getRiskLevelText(risk.inherent_risk_score)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditFormOpen(true)}>
            <Edit className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="assessments">
            التقييمات ({risk.assessments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="treatment">
            خطط المعالجة ({risk.treatment_plans?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Risk Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">معلومات المخاطرة</h3>
            <div className="grid gap-4">
              {risk.risk_description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">الوصف</div>
                  <div>{risk.risk_description}</div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">النوع</div>
                  <div>{risk.risk_type === 'threat' ? 'تهديد' : 'فرصة'}</div>
                </div>
                {risk.treatment_strategy && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      استراتيجية المعالجة
                    </div>
                    <div>
                      {risk.treatment_strategy === 'avoid'
                        ? 'تجنب'
                        : risk.treatment_strategy === 'mitigate'
                        ? 'تخفيف'
                        : risk.treatment_strategy === 'transfer'
                        ? 'نقل'
                        : 'قبول'}
                    </div>
                  </div>
                )}
                {risk.risk_appetite && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      الرغبة في المخاطرة
                    </div>
                    <div>
                      {risk.risk_appetite === 'low'
                        ? 'منخفضة'
                        : risk.risk_appetite === 'medium'
                        ? 'متوسطة'
                        : 'عالية'}
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Scores */}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    المخاطر الأساسية (Inherent Risk)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">الاحتمالية</div>
                      <div className="text-2xl font-bold">{risk.likelihood_score}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">التأثير</div>
                      <div className="text-2xl font-bold">{risk.impact_score}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">النقاط</div>
                      <div className="text-2xl font-bold">
                        {risk.inherent_risk_score}
                      </div>
                    </div>
                  </div>
                </div>

                {risk.residual_risk_score && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      المخاطر المتبقية (Residual Risk)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">الاحتمالية</div>
                        <div className="text-2xl font-bold">
                          {risk.current_likelihood_score}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">التأثير</div>
                        <div className="text-2xl font-bold">
                          {risk.current_impact_score}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">النقاط</div>
                        <div className="text-2xl font-bold text-green-600">
                          {risk.residual_risk_score}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dates */}
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">تاريخ التحديد</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(new Date(risk.identified_date), 'PPP', {
                      locale: ar,
                    })}
                  </div>
                </div>
                {risk.last_review_date && (
                  <div>
                    <div className="text-muted-foreground mb-1">آخر مراجعة</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(new Date(risk.last_review_date), 'PPP', {
                        locale: ar,
                      })}
                    </div>
                  </div>
                )}
                {risk.next_review_date && (
                  <div>
                    <div className="text-muted-foreground mb-1">المراجعة القادمة</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(new Date(risk.next_review_date), 'PPP', {
                        locale: ar,
                      })}
                    </div>
                  </div>
                )}
              </div>

              {risk.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">ملاحظات</div>
                    <div className="text-sm">{risk.notes}</div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">سجل التقييمات</h3>
            <Button onClick={() => setIsAssessmentFormOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة تقييم
            </Button>
          </div>

          {!risk.assessments || risk.assessments.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              لا توجد تقييمات لهذه المخاطرة
            </Card>
          ) : (
            <div className="space-y-4">
              {risk.assessments.map((assessment) => (
                <Card key={assessment.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-semibold mb-1">
                        {assessment.assessment_type === 'initial'
                          ? 'تقييم أولي'
                          : assessment.assessment_type === 'periodic'
                          ? 'تقييم دوري'
                          : assessment.assessment_type === 'ad_hoc'
                          ? 'تقييم طارئ'
                          : 'تقييم بسبب حادثة'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(new Date(assessment.assessment_date), 'PPP', {
                          locale: ar,
                        })}
                      </div>
                    </div>
                    <Badge className={getRiskLevelColor(assessment.risk_score)}>
                      {getRiskLevelText(assessment.risk_score)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">الاحتمالية</div>
                      <div className="text-xl font-bold">
                        {assessment.likelihood_score}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">التأثير</div>
                      <div className="text-xl font-bold">
                        {assessment.impact_score}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">النقاط</div>
                      <div className="text-xl font-bold">{assessment.risk_score}</div>
                    </div>
                  </div>

                  {assessment.key_findings && (
                    <div className="mb-2">
                      <div className="text-sm font-medium mb-1">النتائج الرئيسية</div>
                      <div className="text-sm">{assessment.key_findings}</div>
                    </div>
                  )}

                  {assessment.recommendations && (
                    <div>
                      <div className="text-sm font-medium mb-1">التوصيات</div>
                      <div className="text-sm">{assessment.recommendations}</div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Treatment Plans Tab */}
        <TabsContent value="treatment" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">خطط المعالجة</h3>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة خطة معالجة
            </Button>
          </div>

          {!risk.treatment_plans || risk.treatment_plans.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              لا توجد خطط معالجة لهذه المخاطرة
            </Card>
          ) : (
            <div className="space-y-4">
              {risk.treatment_plans.map((plan) => (
                <Card key={plan.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold mb-1">{plan.plan_title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {plan.treatment_strategy === 'avoid'
                            ? 'تجنب'
                            : plan.treatment_strategy === 'mitigate'
                            ? 'تخفيف'
                            : plan.treatment_strategy === 'transfer'
                            ? 'نقل'
                            : 'قبول'}
                        </Badge>
                        <Badge variant="outline">{plan.plan_status}</Badge>
                        <Badge variant="outline">{plan.priority}</Badge>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {plan.progress_percentage}%
                    </div>
                  </div>

                  {plan.plan_description && (
                    <div className="mb-4 text-sm">{plan.plan_description}</div>
                  )}

                  {plan.due_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>الموعد المستهدف:</span>
                      <span>
                        {formatDate(new Date(plan.due_date), 'PPP', { locale: ar })}
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      {isEditFormOpen && (
        <RiskForm
          open={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
          risk={risk}
          mode="edit"
        />
      )}

      {/* Assessment Form Dialog */}
      {isAssessmentFormOpen && (
        <RiskAssessmentForm
          open={isAssessmentFormOpen}
          onOpenChange={setIsAssessmentFormOpen}
          riskId={risk.id}
          riskTitle={risk.risk_title}
        />
      )}
    </div>
  );
}
