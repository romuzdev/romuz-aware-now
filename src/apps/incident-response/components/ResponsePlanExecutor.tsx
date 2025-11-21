/**
 * M18: Incident Response System - Response Plan Executor
 * Step-by-step execution of incident response plans
 */

import React, { useState } from 'react';
import { Check, Clock, AlertCircle, ChevronRight, Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Progress } from '@/core/components/ui/progress';
import { Separator } from '@/core/components/ui/separator';
import { useToast } from '@/core/components/ui/use-toast';

interface ResponseStep {
  step_number: number;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  responsible_role?: string;
  max_duration_minutes?: number;
  is_critical?: boolean;
}

interface ResponsePlan {
  id: string;
  plan_name_ar: string;
  plan_name_en?: string;
  description_ar?: string;
  incident_type: string;
  response_steps: ResponseStep[];
  escalation_rules?: Record<string, any>;
}

interface StepExecution {
  step_number: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  notes?: string;
  evidence_urls?: string[];
}

interface ResponsePlanExecutorProps {
  plan: ResponsePlan;
  incidentId: string;
  onComplete?: () => void;
  onStepComplete?: (stepNumber: number, execution: StepExecution) => void;
  className?: string;
}

/**
 * Format duration in Arabic
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
}

/**
 * Response Plan Executor Component
 */
export function ResponsePlanExecutor({
  plan,
  incidentId,
  onComplete,
  onStepComplete,
  className,
}: ResponsePlanExecutorProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [executions, setExecutions] = useState<Record<number, StepExecution>>({});
  const [stepNotes, setStepNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedSteps = [...plan.response_steps].sort((a, b) => a.step_number - b.step_number);
  const totalSteps = sortedSteps.length;
  const completedSteps = Object.values(executions).filter(
    (exec) => exec.status === 'completed'
  ).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  /**
   * Start a step
   */
  const startStep = (stepNumber: number) => {
    setExecutions((prev) => ({
      ...prev,
      [stepNumber]: {
        step_number: stepNumber,
        status: 'in_progress',
        started_at: new Date(),
      },
    }));
    setCurrentStep(stepNumber);
  };

  /**
   * Complete a step
   */
  const completeStep = async () => {
    const step = sortedSteps.find((s) => s.step_number === currentStep);
    if (!step) return;

    setIsSubmitting(true);

    try {
      const execution: StepExecution = {
        step_number: currentStep,
        status: 'completed',
        started_at: executions[currentStep]?.started_at,
        completed_at: new Date(),
        notes: stepNotes,
      };

      setExecutions((prev) => ({
        ...prev,
        [currentStep]: execution,
      }));

      // Call callback
      if (onStepComplete) {
        onStepComplete(currentStep, execution);
      }

      toast({
        title: 'تم إكمال الخطوة',
        description: `تم إكمال الخطوة ${currentStep}: ${step.title_ar}`,
      });

      // Clear notes
      setStepNotes('');

      // Move to next step
      const nextStepIndex = sortedSteps.findIndex((s) => s.step_number === currentStep) + 1;
      if (nextStepIndex < sortedSteps.length) {
        const nextStep = sortedSteps[nextStepIndex];
        startStep(nextStep.step_number);
      } else {
        // All steps completed
        if (onComplete) {
          onComplete();
        }
        toast({
          title: '✅ تم إكمال الخطة',
          description: 'تم إنهاء جميع خطوات الاستجابة بنجاح',
        });
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إكمال الخطوة',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Skip a step
   */
  const skipStep = () => {
    const execution: StepExecution = {
      step_number: currentStep,
      status: 'skipped',
      notes: stepNotes || 'تم تجاوز الخطوة',
    };

    setExecutions((prev) => ({
      ...prev,
      [currentStep]: execution,
    }));

    setStepNotes('');

    // Move to next step
    const nextStepIndex = sortedSteps.findIndex((s) => s.step_number === currentStep) + 1;
    if (nextStepIndex < sortedSteps.length) {
      const nextStep = sortedSteps[nextStepIndex];
      startStep(nextStep.step_number);
    }
  };

  const currentStepData = sortedSteps.find((s) => s.step_number === currentStep);
  const isLastStep = sortedSteps[sortedSteps.length - 1]?.step_number === currentStep;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{plan.plan_name_ar}</CardTitle>
              {plan.plan_name_en && (
                <CardDescription className="text-base">
                  {plan.plan_name_en}
                </CardDescription>
              )}
            </div>
            <Badge variant="outline" className="text-sm">
              {plan.incident_type}
            </Badge>
          </div>
          {plan.description_ar && (
            <p className="text-sm text-muted-foreground mt-2">
              {plan.description_ar}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدم الإجمالي</span>
              <span className="font-medium">
                {completedSteps} من {totalSteps} خطوة
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Steps List */}
      <div className="space-y-3">
        {sortedSteps.map((step, index) => {
          const execution = executions[step.step_number];
          const isActive = currentStep === step.step_number;
          const isCompleted = execution?.status === 'completed';
          const isSkipped = execution?.status === 'skipped';
          const isPending = !execution || execution.status === 'pending';

          return (
            <Card
              key={step.step_number}
              className={cn(
                'transition-all',
                isActive && 'ring-2 ring-primary shadow-md',
                isCompleted && 'bg-green-50/50',
                isSkipped && 'bg-gray-50/50 opacity-75'
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Step number icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-semibold',
                      isCompleted && 'bg-green-500 border-green-500 text-white',
                      isSkipped && 'bg-gray-400 border-gray-400 text-white',
                      isActive && 'bg-primary border-primary text-primary-foreground',
                      isPending && 'bg-background border-border text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : isSkipped ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      step.step_number
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base leading-tight">
                            {step.title_ar}
                          </h3>
                          {step.is_critical && (
                            <Badge variant="destructive" className="text-xs">
                              حرجة
                            </Badge>
                          )}
                        </div>
                        {step.title_en && (
                          <p className="text-sm text-muted-foreground">
                            {step.title_en}
                          </p>
                        )}
                      </div>

                      {step.max_duration_minutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {formatDuration(step.max_duration_minutes)}
                        </div>
                      )}
                    </div>

                    {step.description_ar && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description_ar}
                      </p>
                    )}

                    {step.responsible_role && (
                      <Badge variant="outline" className="text-xs">
                        المسؤول: {step.responsible_role}
                      </Badge>
                    )}

                    {/* Expanded content for active step */}
                    {isActive && (
                      <>
                        <Separator className="my-4" />
                        
                        <div className="space-y-4">
                          {/* Notes input */}
                          <div className="space-y-2">
                            <Label htmlFor="step-notes">
                              ملاحظات الخطوة (اختياري)
                            </Label>
                            <Textarea
                              id="step-notes"
                              placeholder="أضف ملاحظات حول تنفيذ هذه الخطوة..."
                              value={stepNotes}
                              onChange={(e) => setStepNotes(e.target.value)}
                              rows={3}
                              className="resize-none"
                            />
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={completeStep}
                              disabled={isSubmitting}
                              size="sm"
                            >
                              <Check className="h-4 w-4 ml-2" />
                              {isLastStep ? 'إنهاء الخطة' : 'إكمال الخطوة'}
                            </Button>

                            {!step.is_critical && (
                              <Button
                                variant="outline"
                                onClick={skipStep}
                                disabled={isSubmitting}
                                size="sm"
                              >
                                <ChevronRight className="h-4 w-4 ml-2" />
                                تجاوز
                              </Button>
                            )}
                          </div>

                          {step.is_critical && (
                            <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                              <p className="text-yellow-800">
                                هذه خطوة حرجة ولا يمكن تجاوزها. يجب إكمالها للمتابعة.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Show notes for completed/skipped steps */}
                    {(isCompleted || isSkipped) && execution.notes && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="font-medium mb-1">الملاحظات:</p>
                        <p className="text-muted-foreground">{execution.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Start button - only show if not started */}
      {currentStep === 0 && sortedSteps.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold">جاهز للبدء؟</h3>
              <p className="text-sm text-muted-foreground">
                ابدأ تنفيذ خطة الاستجابة خطوة بخطوة
              </p>
            </div>
            <Button onClick={() => startStep(sortedSteps[0].step_number)} size="lg">
              بدء التنفيذ
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
