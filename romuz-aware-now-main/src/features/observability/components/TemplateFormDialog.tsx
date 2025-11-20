// ============================================================================
// Gate-E: Template Form Dialog Component
// ============================================================================

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { useAlertTemplates } from '@/features/observability/hooks/useAlertTemplates';
import type { AlertTemplate, CreateAlertTemplateData } from '@/modules/observability';

const templateSchema = z.object({
  code: z.string().min(1, 'الكود مطلوب'),
  locale: z.enum(['ar', 'en']),
  subject_tpl: z.string().min(1, 'عنوان الرسالة مطلوب'),
  body_tpl: z.string().min(1, 'محتوى الرسالة مطلوب'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AlertTemplate | null;
}

export function TemplateFormDialog({ open, onOpenChange, template }: TemplateFormDialogProps) {
  const { createTemplate, updateTemplate } = useAlertTemplates();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      locale: 'ar',
      code: '',
      subject_tpl: '',
      body_tpl: '',
    },
  });

  const selectedLocale = watch('locale');

  useEffect(() => {
    if (template) {
      setValue('code', template.code);
      setValue('locale', template.locale);
      setValue('subject_tpl', template.subject_tpl);
      setValue('body_tpl', template.body_tpl);
    } else {
      reset();
    }
  }, [template, setValue, reset]);

  const onSubmit = (data: TemplateFormData) => {
    const payload: CreateAlertTemplateData = {
      code: data.code,
      locale: data.locale,
      subject_tpl: data.subject_tpl,
      body_tpl: data.body_tpl,
    };

    if (template) {
      updateTemplate({ id: template.id, data: payload });
    } else {
      createTemplate(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'تعديل القالب' : 'إضافة قالب جديد'}</DialogTitle>
          <DialogDescription>
            قم بتحديد نص التنبيه الذي سيتم إرساله. يمكنك استخدام المتغيرات: {'{'}{'{'} metric {'}'}{'}'},  {'{'}{'{'} value {'}'}{'}'},  {'{'}{'{'} baseline {'}'}{'}'},  {'{'}{'{'} severity {'}'}{'}'}, {'{'}{'{'} time_window {'}'}{'}'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الكود</Label>
              <Input {...register('code')} placeholder="kpi_alert" disabled={!!template} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>اللغة</Label>
              <Select value={selectedLocale} onValueChange={(v) => setValue('locale', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>عنوان الرسالة</Label>
            <Input
              {...register('subject_tpl')}
              placeholder="[{{severity}}] تنبيه: {{metric}}"
            />
            {errors.subject_tpl && <p className="text-sm text-destructive">{errors.subject_tpl.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>محتوى الرسالة</Label>
            <Textarea
              {...register('body_tpl')}
              placeholder="تم اكتشاف {{metric}} = {{value}}% (الحد: {{baseline}}%) في نافذة {{time_window}}."
              rows={6}
            />
            {errors.body_tpl && <p className="text-sm text-destructive">{errors.body_tpl.message}</p>}
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-semibold mb-2">المتغيرات المتاحة:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><code>{'{{metric}}'}</code> - اسم المقياس</li>
              <li><code>{'{{value}}'}</code> - القيمة الفعلية</li>
              <li><code>{'{{baseline}}'}</code> - القيمة المرجعية</li>
              <li><code>{'{{severity}}'}</code> - مستوى الأهمية</li>
              <li><code>{'{{time_window}}'}</code> - الفترة الزمنية</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              {template ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
