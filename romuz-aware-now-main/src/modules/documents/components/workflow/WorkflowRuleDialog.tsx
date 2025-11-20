/**
 * Workflow Rule Dialog Component
 * 
 * Dialog for creating/editing workflow rules
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import {
  useCreateWorkflowRule,
  useUpdateWorkflowRule,
} from '../../hooks/useDocumentWorkflows';
import type { WorkflowRule } from '../../integration/workflow-automation.integration';

const ruleSchema = z.object({
  rule_name: z.string().min(1, 'اسم القاعدة مطلوب').max(100, 'الاسم طويل جداً'),
  description: z.string().max(500, 'الوصف طويل جداً').optional(),
  rule_type: z.enum(['auto_approval', 'expiration_alert', 'auto_tagging', 'version_alert']),
  is_enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(0),
  conditions: z.record(z.any()).default({}),
  actions: z.record(z.any()).default({}),
  app_code: z.string().optional().nullable(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface WorkflowRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: WorkflowRule | null;
}

export function WorkflowRuleDialog({ open, onOpenChange, rule }: WorkflowRuleDialogProps) {
  const isEditing = !!rule;
  const createRule = useCreateWorkflowRule();
  const updateRule = useUpdateWorkflowRule();

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      rule_name: '',
      description: '',
      rule_type: 'auto_approval',
      is_enabled: true,
      priority: 0,
      conditions: {},
      actions: {},
      app_code: null,
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        rule_name: rule.rule_name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        is_enabled: rule.is_enabled,
        priority: rule.priority,
        conditions: rule.conditions,
        actions: rule.actions,
        app_code: rule.app_code,
      });
    } else {
      form.reset({
        rule_name: '',
        description: '',
        rule_type: 'auto_approval',
        is_enabled: true,
        priority: 0,
        conditions: {},
        actions: {},
        app_code: null,
      });
    }
  }, [rule, form]);

  const onSubmit = (data: RuleFormValues) => {
    if (isEditing) {
      updateRule.mutate(
        { ruleId: rule.id, updates: data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createRule.mutate(data as any, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل القاعدة' : 'إنشاء قاعدة جديدة'}</DialogTitle>
          <DialogDescription>
            قم بتكوين قاعدة التشغيل الآلي للوثائق
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
                    <Input placeholder="مثال: موافقة تلقائية للسياسات" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف القاعدة..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع القاعدة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="auto_approval">موافقة تلقائية</SelectItem>
                        <SelectItem value="expiration_alert">تنبيه انتهاء</SelectItem>
                        <SelectItem value="auto_tagging">وسوم ذكية</SelectItem>
                        <SelectItem value="version_alert">تنبيه إصدار</SelectItem>
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
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormDescription>
                      القواعد ذات الأولوية الأعلى تُنفذ أولاً
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="app_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نطاق التطبيق (اختياري)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع التطبيقات" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">جميع التطبيقات</SelectItem>
                      <SelectItem value="audits">التدقيق</SelectItem>
                      <SelectItem value="awareness">التوعية</SelectItem>
                      <SelectItem value="committees">اللجان</SelectItem>
                      <SelectItem value="policies">السياسات</SelectItem>
                      <SelectItem value="risks">المخاطر</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    حدد التطبيق المستهدف أو اتركه فارغاً لتطبيق القاعدة على جميع التطبيقات
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">تفعيل القاعدة</FormLabel>
                    <FormDescription>
                      القواعد المفعّلة سيتم تنفيذها تلقائياً
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
              <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                {isEditing ? 'حفظ التغييرات' : 'إنشاء القاعدة'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
