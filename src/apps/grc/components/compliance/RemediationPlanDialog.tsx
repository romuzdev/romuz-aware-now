/**
 * Remediation Plan Dialog Component
 * Displays automated remediation plans for compliance gaps
 */

import { useEffect, useState } from 'react';
import { FileText, Clock, Users, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useGenerateRemediationPlan } from '@/modules/grc';
import type { AutomatedComplianceGap } from '@/modules/grc/integration/compliance-automation.integration';

interface RemediationPlanDialogProps {
  gap: AutomatedComplianceGap;
  open: boolean;
  onClose: () => void;
}

export function RemediationPlanDialog({
  gap,
  open,
  onClose,
}: RemediationPlanDialogProps) {
  const [plan, setPlan] = useState<any>(null);
  const generatePlan = useGenerateRemediationPlan();

  useEffect(() => {
    if (open && gap) {
      generatePlan.mutateAsync(gap).then(setPlan);
    }
  }, [open, gap]);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-blue-600 bg-blue-50 border-blue-200',
    };
    return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      compliance_officer: 'مسؤول الامتثال',
      process_owner: 'مالك العملية',
      training_manager: 'مدير التدريب',
      internal_audit: 'المدقق الداخلي',
    };
    return labels[role] || role;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            خطة المعالجة التلقائية
          </DialogTitle>
          <DialogDescription>
            خطة مفصلة لمعالجة الفجوة: {gap.requirement_code}
          </DialogDescription>
        </DialogHeader>

        {generatePlan.isPending ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">جاري إنشاء خطة المعالجة...</p>
          </div>
        ) : plan ? (
          <div className="space-y-6">
            {/* Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الأولوية</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className={getPriorityColor(plan.priority)}>
                    {plan.priority === 'critical' && 'حرجة'}
                    {plan.priority === 'high' && 'عالية'}
                    {plan.priority === 'medium' && 'متوسطة'}
                    {plan.priority === 'low' && 'منخفضة'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المدة المقدرة</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{plan.estimated_timeline_days}</div>
                  <p className="text-xs text-muted-foreground">يوم عمل</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الخطوات</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{plan.remediation_steps.length}</div>
                  <p className="text-xs text-muted-foreground">خطوة تنفيذ</p>
                </CardContent>
              </Card>
            </div>

            {/* Resources Needed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  الموارد المطلوبة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {plan.resources_needed.map((resource: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {resource}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Remediation Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">خطوات المعالجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plan.remediation_steps.map((step: any) => (
                    <div
                      key={step.step_number}
                      className="relative pl-8 pb-4 border-l-2 border-muted last:border-0"
                    >
                      <div className="absolute -right-3 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {step.step_number}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-medium">{step.description}</h4>
                          <Badge variant="outline" className="shrink-0">
                            {step.duration_days} يوم
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>المسؤول: {getRoleLabel(step.responsible_role)}</span>
                        </div>
                        {step.dependencies && step.dependencies.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            يعتمد على الخطوات: {step.dependencies.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                إغلاق
              </Button>
              <Button onClick={() => {
                // TODO: Implement plan export or save to action plans
                console.log('Export plan:', plan);
              }}>
                <FileText className="ml-2 h-4 w-4" />
                تصدير الخطة
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">فشل إنشاء خطة المعالجة</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
