import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/core/components/ui/form';
import { Plus, X } from 'lucide-react';
import type { Question } from '../../types';

const questionSchema = z.object({
  question_text: z.string().min(5, 'يجب أن يكون السؤال 5 أحرف على الأقل'),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']),
  points: z.number().positive('يجب أن تكون النقاط رقم موجب'),
  options: z.array(z.object({
    text: z.string().min(1, 'النص مطلوب'),
    is_correct: z.boolean(),
  })).optional(),
  correct_answer: z.string().optional(),
  explanation: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  question?: Question;
  onSubmit: (data: QuestionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuestionForm({ question, onSubmit, onCancel, isLoading }: QuestionFormProps) {
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: question?.question_text || '',
      question_type: question?.question_type || 'multiple_choice',
      points: question?.points || 1,
      options: question?.options || [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
      correct_answer: question?.correct_answer || '',
      explanation: question?.explanation || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const questionType = form.watch('question_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="question_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع السؤال *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="multiple_choice">اختيار من متعدد</SelectItem>
                  <SelectItem value="true_false">صح/خطأ</SelectItem>
                  <SelectItem value="short_answer">إجابة قصيرة</SelectItem>
                  <SelectItem value="essay">مقالي</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نص السؤال *</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="اكتب السؤال هنا..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>النقاط *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(questionType === 'multiple_choice' || questionType === 'true_false') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>الخيارات</FormLabel>
              {questionType === 'multiple_choice' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ text: '', is_correct: false })}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة خيار
                </Button>
              )}
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`options.${index}.text`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} placeholder={`الخيار ${index + 1}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`options.${index}.is_correct`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-2">
                      <FormLabel className="text-sm">صحيح</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {questionType === 'multiple_choice' && fields.length > 2 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {(questionType === 'short_answer' || questionType === 'essay') && (
          <FormField
            control={form.control}
            name="correct_answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الإجابة النموذجية (اختياري)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder="الإجابة النموذجية للمراجعة..." />
                </FormControl>
                <FormDescription>
                  ستحتاج الأسئلة المقالية لتقييم يدوي
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الشرح (اختياري)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} placeholder="شرح الإجابة الصحيحة..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : question ? 'تحديث' : 'إضافة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
