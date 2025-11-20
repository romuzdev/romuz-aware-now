import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useAssessmentById, useAssessmentQuestions } from '@/modules/training/hooks/useAssessments';
import { QuestionList } from '@/modules/training/components/assessments';

export default function AssessmentBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: assessment, isLoading: assessmentLoading } = useAssessmentById(id);
  const { data: questions, isLoading: questionsLoading } = useAssessmentQuestions(id);

  if (assessmentLoading || questionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">الاختبار غير موجود</p>
      </div>
    );
  }

  const totalPoints = questions?.reduce((sum, q) => sum + q.points, 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/lms/courses/${assessment.course_id}`)}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">بناء الاختبار</h1>
          <p className="text-muted-foreground mt-1">{assessment.name}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي الأسئلة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{questions?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPoints}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الوقت المحدد</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {assessment.time_limit_minutes || 'غير محدد'}
              {assessment.time_limit_minutes && ' دقيقة'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">درجة النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assessment.passing_score}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <QuestionList assessmentId={assessment.id} questions={questions || []} />
        </CardContent>
      </Card>
    </div>
  );
}
