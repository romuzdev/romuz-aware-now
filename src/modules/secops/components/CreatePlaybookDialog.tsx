/**
 * Create SOAR Playbook Dialog
 * M18.5 - SecOps Integration
 */

import { useState } from 'react';
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
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Card } from '@/core/components/ui/card';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { ConditionBuilder } from '@/components/automation/ConditionBuilder';
import type { SOARPlaybook } from '../types';
import type { RuleConditions } from '@/lib/events/event.types';

const SEVERITY_LEVELS = [
  { value: 'critical', label: 'حرج' },
  { value: 'high', label: 'عالي' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'منخفض' },
  { value: 'info', label: 'معلوماتي' },
];

const EVENT_TYPES = [
  { value: 'malware_detected', label: 'برمجية خبيثة' },
  { value: 'intrusion_attempt', label: 'محاولة اختراق' },
  { value: 'data_exfiltration', label: 'تسريب بيانات' },
  { value: 'unauthorized_access', label: 'وصول غير مصرح' },
  { value: 'ddos_attack', label: 'هجوم حجب الخدمة' },
  { value: 'phishing_detected', label: 'تصيد احتيالي' },
  { value: 'suspicious_activity', label: 'نشاط مشبوه' },
];

const ACTION_TYPES = [
  { value: 'block_ip', label: 'حظر IP' },
  { value: 'isolate_endpoint', label: 'عزل جهاز' },
  { value: 'quarantine_file', label: 'عزل ملف' },
  { value: 'disable_account', label: 'تعطيل حساب' },
  { value: 'send_alert', label: 'إرسال تنبيه' },
  { value: 'create_ticket', label: 'إنشاء تذكرة' },
  { value: 'run_scan', label: 'فحص أمني' },
];

const formSchema = z.object({
  playbook_name_ar: z.string().min(3, 'اسم الدليل مطلوب (3 أحرف على الأقل)'),
  description_ar: z.string().optional(),
  severity_levels: z.array(z.string()).min(1, 'اختر مستوى خطورة واحد على الأقل'),
  event_types: z.array(z.string()).min(1, 'اختر نوع حدث واحد على الأقل'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePlaybookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (playbook: Omit<SOARPlaybook, 'id' | 'execution_count' | 'success_count' | 'created_at' | 'updated_at'>) => void;
}

export function CreatePlaybookDialog({ open, onOpenChange, onSubmit }: CreatePlaybookDialogProps) {
  const [conditions, setConditions] = useState<RuleConditions>({
    logic: 'AND',
    rules: [{ field: '', operator: 'eq', value: '' }],
  });
  
  const [steps, setSteps] = useState<Array<{
    step_order: number;
    action_type: string;
    action_config: Record<string, any>;
    description_ar?: string;
  }>>([
    {
      step_order: 1,
      action_type: '',
      action_config: {},
      description_ar: '',
    },
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playbook_name_ar: '',
      description_ar: '',
      severity_levels: [],
      event_types: [],
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Validate steps
    const validSteps = steps.filter(s => s.action_type);
    if (validSteps.length === 0) {
      form.setError('root', { message: 'أضف خطوة تنفيذ واحدة على الأقل' });
      return;
    }

    const playbook = {
      tenant_id: '', // Will be set by integration layer
      playbook_name_ar: values.playbook_name_ar,
      description_ar: values.description_ar || null,
      severity_levels: values.severity_levels,
      event_types: values.event_types,
      trigger_conditions: conditions,
      automation_steps: validSteps.map((step, idx) => ({
        ...step,
        step_order: idx + 1,
      })),
      is_active: false,
      created_by: '', // Will be set by integration layer
    };

    onSubmit(playbook as any);
    form.reset();
    setConditions({ logic: 'AND', rules: [{ field: '', operator: 'eq', value: '' }] });
    setSteps([{ step_order: 1, action_type: '', action_config: {}, description_ar: '' }]);
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_order: steps.length + 1,
        action_type: '',
        action_config: {},
        description_ar: '',
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء دليل SOAR جديد</DialogTitle>
          <DialogDescription>
            قم بإنشاء دليل استجابة آلي للأحداث الأمنية
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
              
              <FormField
                control={form.control}
                name="playbook_name_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الدليل *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: حظر عنوان IP مشبوه تلقائياً" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="وصف مختصر لوظيفة هذا الدليل..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Severity Levels */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">مستويات الخطورة المستهدفة *</h3>
              <FormField
                control={form.control}
                name="severity_levels"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SEVERITY_LEVELS.map((level) => (
                        <FormField
                          key={level.value}
                          control={form.control}
                          name="severity_levels"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(level.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, level.value])
                                      : field.onChange(
                                          field.value?.filter((val) => val !== level.value)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 cursor-pointer">
                                {level.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Event Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">أنواع الأحداث المستهدفة *</h3>
              <FormField
                control={form.control}
                name="event_types"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {EVENT_TYPES.map((type) => (
                        <FormField
                          key={type.value}
                          control={form.control}
                          name="event_types"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type.value])
                                      : field.onChange(
                                          field.value?.filter((val) => val !== type.value)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 cursor-pointer">
                                {type.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trigger Conditions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">شروط التفعيل</h3>
                <FormDescription className="!mt-0">
                  (اختياري - إذا لم تحدد شروطاً، سيعمل الدليل على جميع الأحداث المطابقة)
                </FormDescription>
              </div>
              <Card className="p-4">
                <ConditionBuilder
                  conditions={conditions}
                  onChange={setConditions}
                />
              </Card>
            </div>

            {/* Automation Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">خطوات التنفيذ الآلي *</h3>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة خطوة
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">
                              نوع الإجراء *
                            </label>
                            <select
                              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={step.action_type}
                              onChange={(e) => updateStep(index, 'action_type', e.target.value)}
                            >
                              <option value="">اختر الإجراء...</option>
                              {ACTION_TYPES.map((action) => (
                                <option key={action.value} value={action.value}>
                                  {action.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">
                              الوصف
                            </label>
                            <Input
                              placeholder="وصف الخطوة..."
                              value={step.description_ar || ''}
                              onChange={(e) => updateStep(index, 'description_ar', e.target.value)}
                            />
                          </div>
                        </div>

                        {step.action_type && (
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">
                              إعدادات الإجراء (JSON)
                            </label>
                            <Textarea
                              placeholder='{"target": "source_ip", "duration": 3600}'
                              className="font-mono text-xs"
                              value={JSON.stringify(step.action_config, null, 2)}
                              onChange={(e) => {
                                try {
                                  const config = JSON.parse(e.target.value);
                                  updateStep(index, 'action_config', config);
                                } catch {
                                  // Invalid JSON, ignore
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(index)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {form.formState.errors.root && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}
            </div>

            {/* Warning */}
            <Card className="p-4 bg-amber-500/10 border-amber-500/20">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    تنبيه هام
                  </p>
                  <p className="text-muted-foreground">
                    سيتم إنشاء الدليل في وضع "غير نشط" افتراضياً. يمكنك تفعيله لاحقاً بعد التأكد من 
                    إعداداته. الدليل النشط سيبدأ تلقائياً بمعالجة الأحداث الأمنية المطابقة!
                  </p>
                </div>
              </div>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                إنشاء الدليل
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
