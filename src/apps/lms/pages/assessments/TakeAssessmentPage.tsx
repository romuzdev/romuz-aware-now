import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useAssessmentById, useAssessmentQuestions, useSubmitAssessment } from '@/modules/training/hooks/useAssessments';
import { AssessmentTaker } from '@/modules/training/components/assessments';
import { useState } from 'react';

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hasStarted, setHasStarted] = useState(false);

  const { data: assessment, isLoading: assessmentLoading } = useAssessmentById(id);
  const { data: questions, isLoading: questionsLoading } = useAssessmentQuestions(id);
  const submitMutation = useSubmitAssessment();

  const handleSubmit = async (answers: Record<string, any>) => {
    if (!assessment) return;

    try {
      await submitMutation.mutateAsync({
        assessment_id: assessment.id,
        answers,
      });
      navigate(`/employee/assessments/${id}/result`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  if (assessmentLoading || questionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!assessment || !questions) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">الاختبار غير موجود</p>
      </div>
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (!hasStarted) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{assessment.name}</CardTitle>
            {assessment.description && (
              <CardDescription>{assessment.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">إجمالي النقاط</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              {assessment.time_limit_minutes && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">الوقت المحدد</p>
                  <p className="text-2xl font-bold">{assessment.time_limit_minutes} دقيقة</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">درجة النجاح</p>
                <p className="text-2xl font-bold">{assessment.passing_score}%</p>
              </div>
              {assessment.max_attempts && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">عدد المحاولات المسموحة</p>
                  <p className="text-2xl font-bold">{assessment.max_attempts}</p>
                </div>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">تعليمات هامة:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>اقرأ كل سؤال بعناية قبل الإجابة</li>
                    <li>يمكنك التنقل بين الأسئلة قبل التسليم</li>
                    {assessment.time_limit_minutes && (
                      <li>سيتم تسليم الاختبار تلقائياً عند انتهاء الوقت</li>
                    )}
                    <li>تأكد من إجاباتك قبل التسليم النهائي</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => navigate(-1)} variant="outline" className="flex-1">
                رجوع
              </Button>
              <Button onClick={() => setHasStarted(true)} className="flex-1">
                <CheckCircle2 className="ml-2 h-4 w-4" />
                ابدأ الاختبار
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{assessment.name}</h1>
      </div>

      <AssessmentTaker
        questions={questions}
        timeLimit={assessment.time_limit_minutes || undefined}
        onSubmit={handleSubmit}
        isLoading={submitMutation.isPending}
      />
    </div>
  );
}
