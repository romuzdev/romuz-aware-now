import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { QuestionForm } from './QuestionForm';
import type { Question } from '../../types';
import { useAddQuestion, useUpdateQuestion, useDeleteQuestion } from '../../hooks/useAssessments';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';

interface QuestionListProps {
  assessmentId: string;
  questions: Question[];
}

export function QuestionList({ assessmentId, questions }: QuestionListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addMutation = useAddQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const handleSubmit = async (data: any) => {
    if (editingQuestion) {
      await updateMutation.mutateAsync({ id: editingQuestion.id, input: data });
    } else {
      await addMutation.mutateAsync({
        ...data,
        assessment_id: assessmentId,
        position: questions.length + 1,
      });
    }
    handleCloseForm();
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      multiple_choice: 'اختيار من متعدد',
      true_false: 'صح/خطأ',
      short_answer: 'إجابة قصيرة',
      essay: 'مقالي',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الأسئلة ({questions.length})</h3>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة سؤال
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد أسئلة. ابدأ بإضافة سؤال جديد.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Button variant="ghost" size="icon" className="cursor-move">
                    <GripVertical className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">السؤال {index + 1}</span>
                      <Badge variant="outline">{getQuestionTypeLabel(question.question_type)}</Badge>
                      <Badge variant="secondary">{question.points} نقطة</Badge>
                    </div>
                    <CardTitle className="text-base font-normal">
                      {question.question_text}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingId(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && 
               question.options && (
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {question.options.map((option: any, idx: number) => (
                      <div
                        key={idx}
                        className={`text-sm p-2 rounded ${
                          option.is_correct ? 'bg-success/10 text-success' : ''
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {option.text}
                        {option.is_correct && ' ✓'}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'تعديل السؤال' : 'سؤال جديد'}
            </DialogTitle>
          </DialogHeader>
          <QuestionForm
            question={editingQuestion || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={addMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
