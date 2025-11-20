/**
 * Automation Rule Dialog Component
 * Week 4 - Phase 4
 */

import { useEffect } from 'react';
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
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import { useAutomationRules } from '../hooks/useAutomation';
import type { AutomationRule } from '../types/automation.types';

const formSchema = z.object({
  rule_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  description_ar: z.string().optional(),
  trigger_event_types: z.array(z.string()).min(1, 'يجب تحديد حدث واحد على الأقل'),
  execution_mode: z.enum(['immediate', 'scheduled', 'batch']),
  priority: z.number().min(0).max(100),
  is_enabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface AutomationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AutomationRule | null;
}

export function AutomationRuleDialog({ open, onOpenChange, rule }: AutomationRuleDialogProps) {
  const { createRule, updateRule } = useAutomationRules();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rule_name: '',
      description_ar: '',
      trigger_event_types: [],
      execution_mode: 'immediate',
      priority: 50,
      is_enabled: true,
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        rule_name: rule.rule_name,
        description_ar: rule.description_ar || '',
        trigger_event_types: rule.trigger_event_types,
        execution_mode: rule.execution_mode,
        priority: rule.priority,
        is_enabled: rule.is_enabled,
      });
    } else {
      form.reset({
        rule_name: '',
        description_ar: '',
        trigger_event_types: [],
        execution_mode: 'immediate',
        priority: 50,
        is_enabled: true,
      });
    }
  }, [rule, form]);

  const onSubmit = (data: FormData) => {
    const ruleData: any = {
      rule_name: data.rule_name,
      description_ar: data.description_ar || undefined,
      trigger_event_types: data.trigger_event_types,
      execution_mode: data.execution_mode,
      priority: data.priority,
      is_enabled: data.is_enabled,
      conditions: [],
      actions: [],
    };

    if (rule) {
      updateRule({ id: rule.id, formData: ruleData });
    } else {
      createRule(ruleData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'تعديل قاعدة الأتمتة' : 'إضافة قاعدة أتمتة جديدة'}
          </DialogTitle>
          <DialogDescription>
            قم بتعريف القاعدة والشروط والإجراءات التلقائية
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rule_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم القاعدة</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: إرسال تنبيه عند إكمال حملة" />
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
                    <Textarea {...field} rows={3} placeholder="وصف مختصر للقاعدة..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="execution_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نمط التنفيذ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">فوري</SelectItem>
                        <SelectItem value="scheduled">مجدول</SelectItem>
                        <SelectItem value="batch">دفعي</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأولوية (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>أعلى قيمة = أولوية أعلى</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>تفعيل القاعدة</FormLabel>
                    <FormDescription>
                      عند التفعيل، ستعمل القاعدة تلقائياً
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {rule ? 'تحديث' : 'إنشاء'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
