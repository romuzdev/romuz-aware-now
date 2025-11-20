/**
 * M18: Incident Response - Response Plans Page
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { useTranslation } from 'react-i18next';
import { useResponsePlans } from '../hooks/useIncidents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/core/components/ui/accordion';

export default function ResponsePlans() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data: plans, isLoading } = useResponsePlans();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTotalDuration = (steps: any[]) => {
    if (!steps || !Array.isArray(steps)) return 0;
    return steps.reduce((total, step) => total + (step.duration_minutes || 0), 0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'خطط الاستجابة' : 'Response Plans'}
        description={
          isRTL
            ? 'خطط جاهزة للاستجابة السريعة للحوادث الأمنية المختلفة'
            : 'Ready-made plans for rapid response to various security incidents'
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid gap-6">
          {plans.map((plan: any) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <code className="text-sm font-mono">{plan.plan_code}</code>
                    </div>
                    <CardTitle className="mb-2">
                      {isRTL ? plan.plan_name_ar : plan.plan_name_en}
                    </CardTitle>
                    <CardDescription>
                      {isRTL ? plan.description_ar : plan.description_en}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {plan.severity_level && (
                    <Badge variant={getSeverityColor(plan.severity_level)}>
                      {isRTL
                        ? {
                            critical: 'حرجة',
                            high: 'عالية',
                            medium: 'متوسطة',
                            low: 'منخفضة',
                          }[plan.severity_level]
                        : plan.severity_level}
                    </Badge>
                  )}
                  {plan.incident_type && (
                    <Badge variant="outline">
                      {isRTL
                        ? {
                            ransomware: 'برامج فدية',
                            data_breach: 'اختراق بيانات',
                            phishing: 'تصيد',
                            malware: 'برامج ضارة',
                            ddos_attack: 'هجوم DDoS',
                          }[plan.incident_type] || plan.incident_type
                        : plan.incident_type}
                    </Badge>
                  )}
                  {plan.is_active && (
                    <Badge variant="secondary">
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                      {isRTL ? 'نشط' : 'Active'}
                    </Badge>
                  )}
                  {plan.response_steps && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 ml-1" />
                      {getTotalDuration(plan.response_steps)}{' '}
                      {isRTL ? 'دقيقة' : 'mins'}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {plan.response_steps && plan.response_steps.length > 0 && (
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="steps">
                      <AccordionTrigger>
                        {isRTL ? 'خطوات الاستجابة' : 'Response Steps'} (
                        {plan.response_steps.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {plan.response_steps.map((step: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {step.step || index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">
                                  {isRTL ? step.title_ar : step.title_en}
                                </h4>
                                {step.duration_minutes && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {step.duration_minutes}{' '}
                                    {isRTL ? 'دقيقة' : 'minutes'}
                                    {step.responsible && (
                                      <>
                                        {' • '}
                                        {step.responsible}
                                      </>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{isRTL ? 'لا توجد خطط استجابة متاحة حالياً' : 'No response plans available'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
