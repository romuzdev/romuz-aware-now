/**
 * M18: Response Plan Executor Component
 * Executes incident response plans step-by-step
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Textarea } from '@/core/components/ui/textarea';
import { CheckCircle2, Circle, Clock, AlertCircle, Play, Pause, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponseStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  responsibleRole: string;
  estimatedDuration: number; // minutes
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  requiredActions?: string[];
}

interface ResponsePlanExecutorProps {
  incidentId: string;
  planName: string;
  steps: ResponseStep[];
  onStepComplete: (stepId: string, notes: string) => void;
  onStepSkip: (stepId: string, reason: string) => void;
}

export function ResponsePlanExecutor({
  incidentId,
  planName,
  steps,
  onStepComplete,
  onStepSkip,
}: ResponsePlanExecutorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [isPaused, setIsPaused] = useState(false);

  const currentStep = steps[currentStepIndex];
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleCompleteStep = () => {
    if (currentStep) {
      onStepComplete(currentStep.id, stepNotes[currentStep.id] || '');
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const handleSkipStep = () => {
    if (currentStep) {
      onStepSkip(currentStep.id, stepNotes[currentStep.id] || 'تم التخطي');
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const handleStepNoteChange = (stepId: string, note: string) => {
    setStepNotes(prev => ({ ...prev, [stepId]: note }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                تنفيذ خطة الاستجابة: {planName}
              </CardTitle>
              <CardDescription>
                الحادثة: {incidentId}
              </CardDescription>
            </div>
            <Button
              variant={isPaused ? 'default' : 'outline'}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4 ml-2" /> : <Pause className="h-4 w-4 ml-2" />}
              {isPaused ? 'استئناف' : 'إيقاف مؤقت'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>التقدم الإجمالي</span>
              <span className="font-medium">{completedSteps} / {steps.length} خطوات</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps Timeline */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">خطوات الخطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => !isPaused && setCurrentStepIndex(index)}
                  disabled={isPaused}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-right transition-colors",
                    index === currentStepIndex ? "bg-primary/10 border border-primary" : "hover:bg-muted",
                    isPaused && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {getStepIcon(step.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {step.stepNumber}. {step.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'in_progress' ? 'secondary' :
                        'outline'
                      } className="text-xs">
                        {step.status === 'completed' ? 'مكتمل' :
                         step.status === 'in_progress' ? 'جاري' :
                         step.status === 'skipped' ? 'متخطى' : 'معلق'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {step.estimatedDuration} دقيقة
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle>
                  الخطوة {currentStep?.stepNumber}: {currentStep?.title}
                </CardTitle>
                <CardDescription>
                  المسؤول: {currentStep?.responsibleRole}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                <Clock className="h-3 w-3 ml-1" />
                {currentStep?.estimatedDuration} دقيقة
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">الوصف</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStep?.description}
              </p>
            </div>

            {/* Required Actions */}
            {currentStep?.requiredActions && currentStep.requiredActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">الإجراءات المطلوبة</h4>
                <ul className="space-y-2">
                  {currentStep.requiredActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">ملاحظات التنفيذ</h4>
              <Textarea
                placeholder="أضف ملاحظات حول تنفيذ هذه الخطوة..."
                value={stepNotes[currentStep?.id] || ''}
                onChange={(e) => currentStep && handleStepNoteChange(currentStep.id, e.target.value)}
                rows={4}
                disabled={isPaused || currentStep?.status === 'completed'}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                onClick={handleCompleteStep}
                disabled={isPaused || currentStep?.status === 'completed' || currentStepIndex === steps.length}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 ml-2" />
                إتمام الخطوة
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipStep}
                disabled={isPaused || currentStep?.status === 'completed' || currentStepIndex === steps.length}
              >
                تخطي
              </Button>
            </div>

            {currentStepIndex === steps.length - 1 && currentStep?.status === 'completed' && (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  تم إكمال خطة الاستجابة بنجاح
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
