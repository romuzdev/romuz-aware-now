/**
 * M18 Part 2: Playbook Step Builder Component
 * Visual builder for playbook steps with drag-and-drop
 */

import { useState } from 'react';
import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Play, 
  AlertCircle, 
  Clock, 
  Mail, 
  Link, 
  Check 
} from 'lucide-react';

interface PlaybookStepBuilderProps {
  steps: any[];
  onStepsChange: (steps: any[]) => void;
}

export function PlaybookStepBuilder({ steps, onStepsChange }: PlaybookStepBuilderProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const updateStep = (index: number, updates: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onStepsChange(newSteps);
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onStepsChange(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update step_order
    newSteps.forEach((step, i) => {
      step.step_order = i + 1;
    });

    onStepsChange(newSteps);
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'action':
        return <Play className="h-4 w-4" />;
      case 'decision':
        return <AlertCircle className="h-4 w-4" />;
      case 'wait':
        return <Clock className="h-4 w-4" />;
      case 'notification':
        return <Mail className="h-4 w-4" />;
      case 'integration':
        return <Link className="h-4 w-4" />;
      case 'approval':
        return <Check className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>لا توجد خطوات بعد</p>
        <p className="text-sm mt-2">انقر على "إضافة خطوة" لبدء بناء Playbook</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={step.id} className="overflow-hidden">
          <CardContent className="p-4">
            {/* Step Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div className="flex items-center gap-2 text-primary">
                    {getStepIcon(step.step_type)}
                  </div>
                </div>
                <div className="flex-1">
                  <Input
                    value={step.step_name}
                    onChange={(e) => updateStep(index, { step_name: e.target.value })}
                    className="font-medium"
                    placeholder="اسم الخطوة"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveStep(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveStep(index, 'down')}
                  disabled={index === steps.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${
                      expandedStep === step.id ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteStep(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            {/* Step Details (Expanded) */}
            {expandedStep === step.id && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الخطوة</Label>
                    <Select
                      value={step.step_type}
                      onValueChange={(value) => updateStep(index, { step_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action">إجراء</SelectItem>
                        <SelectItem value="decision">قرار</SelectItem>
                        <SelectItem value="wait">انتظار</SelectItem>
                        <SelectItem value="notification">إشعار</SelectItem>
                        <SelectItem value="integration">تكامل</SelectItem>
                        <SelectItem value="approval">موافقة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>مهلة التنفيذ (ثواني)</Label>
                    <Input
                      type="number"
                      value={step.timeout_seconds || 300}
                      onChange={(e) =>
                        updateStep(index, { timeout_seconds: parseInt(e.target.value) || 300 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input
                    value={step.step_description_ar || ''}
                    onChange={(e) => updateStep(index, { step_description_ar: e.target.value })}
                    placeholder="وصف الخطوة"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={step.is_critical || false}
                      onChange={(e) => updateStep(index, { is_critical: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">خطوة حرجة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={step.retry_on_failure !== false}
                      onChange={(e) => updateStep(index, { retry_on_failure: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">إعادة المحاولة عند الفشل</span>
                  </label>
                </div>

                {/* Step Type Specific Configuration */}
                {step.step_type === 'wait' && (
                  <div className="space-y-2">
                    <Label>مدة الانتظار (ثواني)</Label>
                    <Input
                      type="number"
                      value={step.action_config?.duration_seconds || 60}
                      onChange={(e) =>
                        updateStep(index, {
                          action_config: {
                            ...step.action_config,
                            duration_seconds: parseInt(e.target.value) || 60,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {step.step_type === 'notification' && (
                  <div className="space-y-2">
                    <Label>قناة الإشعار</Label>
                    <Select
                      value={step.action_config?.channel || 'email'}
                      onValueChange={(value) =>
                        updateStep(index, {
                          action_config: { ...step.action_config, channel: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">البريد الإلكتروني</SelectItem>
                        <SelectItem value="sms">رسالة نصية</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="teams">Teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
